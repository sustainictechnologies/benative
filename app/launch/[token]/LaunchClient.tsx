'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Lora } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'
import { launchHomestay, type LaunchResult } from '@/lib/actions/launch'
import { hostMessage } from '@/components/ShareButton'
import LaunchScene from './LaunchScene'
import './launch.css'

// The BeNative wordmark on this page
const lora = Lora({ subsets: ['latin'], weight: ['700'], variable: '--font-lora' })

export type LaunchGate =
  | null                                                            // the host can launch
  | { kind: 'signin'; hostEmail: string }                           // not signed in
  | { kind: 'email'; hostEmail: string; signedInAs: string }        // signed in with another email

interface Props {
  token:       string
  name:        string
  hostInitial: string
  slug:        string
  live:        boolean
  gate:        LaunchGate
  demo?:       boolean   // the demo (/launch/demo/[slug]): plays everything, publishes nothing
}

/* ---------- night to sunrise (as in the prototype) ---------- */
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const seg   = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
const lerp  = (a: number, b: number, p: number) => a + (b - a) * p
const eio   = (p: number) => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const eis   = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2
const bump  = (t: number, a: number, b: number) => { const p = seg(t, a, b); return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0 }
const rgb   = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const mix   = (a: string, b: string, p: number) => { const A = rgb(a), B = rgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})` }

const END    = 8.6   // full sequence, seconds
const RM_DUR = 2.2   // shorter version for reduced motion

// The page itself follows the sky
const NIGHT: Record<string, string> = { '--muted': '#B7BFCC', '--logo': '#EEE7D2', '--heading': '#EEF0E4', '--tag-bg': '#2B3858', '--tag-fg': '#DCE6D2', '--tag-dot': '#9CC08A', '--chip-bg': '#26324F', '--chip-line': '#3A4767', '--track': '#3A4767' }
const DAY: Record<string, string>   = { '--muted': '#5A5D55', '--logo': '#2C3319', '--heading': '#1F4D1F', '--tag-bg': '#E5ECDE', '--tag-fg': '#163A16', '--tag-dot': '#1F4D1F', '--chip-bg': '#FFFFFF', '--chip-line': '#E6E0D4', '--track': '#E6E0D4' }
const BG_NIGHT = '#1F2A45', BG_DAWN = '#D9BCAE', BG_DAY = '#F7F4EE'
// An already-live link opens straight in the morning colours
const MORNING_STYLE = { ...DAY, '--bg': BG_DAY, colorScheme: 'light' } as CSSProperties

const SCENE_IDS = ['skyDawn', 'skyDay', 'stars', 'moonG', 'sunG', 'sunDisc', 'sunHalo', 'raysWrap', 'beamWrap', 'cloudsWrap', 'warmWrap',
  'nightShade', 'dawnCast', 'lWin1', 'lWin3', 'lGlow1', 'lGlow3', 'lLamp', 'lSpill', 'flock']

const HINTS = ['Turning on the lights…', 'The night is giving way to morning…', 'Opening your doors to travellers…']

const MESSAGES: Record<Exclude<LaunchResult, { success: true }>['reason'], string> = {
  publish: "We couldn't publish your homestay. Please try again.",
  missing: "We couldn't publish your homestay. Please try again.",
  expired: 'This launch link has expired. Ask BeNative for a new one.',
  signin:  'Please sign in again to launch your homestay.',
  email:   'Sign in with the email saved for your homestay to launch it.',
}

const enterDelay = (d: string) => ({ '--d': d } as CSSProperties)

type Outcome = { ok: true; slug: string } | { ok: false; message: string }

export default function LaunchClient({ token, name, hostInitial, slug, live, gate, demo = false }: Props) {
  const [screen, setScreen]           = useState<'ready' | 'live'>(live ? 'live' : 'ready')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [publishing, setPublishing]   = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [announce, setAnnounce]       = useState('')
  const [liveSlug, setLiveSlug]       = useState(slug)
  const [origin, setOrigin]           = useState('https://www.benative.in')
  const [copied, setCopied]           = useState(false)
  const [toast, setToast]             = useState<string | null>(null)

  const rootRef      = useRef<HTMLDivElement>(null)
  const appRef       = useRef<HTMLDivElement>(null)
  const sceneRef     = useRef<SVGSVGElement>(null)
  const launchBtnRef = useRef<HTMLButtonElement>(null)
  const progressRef  = useRef<HTMLSpanElement>(null)
  const hintRef      = useRef<HTMLSpanElement>(null)
  const liveTitleRef = useRef<HTMLHeadingElement>(null)
  const notYetRef    = useRef<HTMLButtonElement>(null)
  const yesRef       = useRef<HTMLButtonElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const els          = useRef<Record<string, SVGElement>>({})
  const lastFocus    = useRef<HTMLElement | null>(null)
  const restoreFocus = useRef(false)
  const justLaunched = useRef(false)
  const mounted      = useRef(true)
  // The launch in progress: the frame loop, whether the morning has come, and the server's answer
  const run          = useRef<{ raf: number; running: boolean; animDone: boolean; outcome: Outcome | null }>({ raf: 0, running: false, animDone: false, outcome: null })
  const toastTimer   = useRef<ReturnType<typeof setTimeout>>()
  const copyTimer    = useRef<ReturnType<typeof setTimeout>>()

  const url         = `${origin}/homestays/${liveSlug}`
  const displayLink = `${origin.replace(/^https?:\/\/(www\.)?/, '')}/homestays/${liveSlug}`

  /* ---------- painting the scene (no React state per frame) ---------- */
  function op(id: string, v: number) { els.current[id]?.setAttribute('opacity', clamp(v).toFixed(3)) }

  function theme(s: number) {
    const style = rootRef.current?.style
    if (!style) return
    style.setProperty('--bg', s < .5 ? mix(BG_NIGHT, BG_DAWN, s * 2) : mix(BG_DAWN, BG_DAY, (s - .5) * 2))
    const k = seg(s, .3, .42)
    for (const key in NIGHT) style.setProperty(key, mix(NIGHT[key], DAY[key], k))
    style.colorScheme = k < .5 ? 'dark' : 'light'
  }

  // Paint the scene at time t (0 = night, END = morning)
  function paint(t: number, noBirds: boolean) {
    const E = els.current
    if (!E.flock) return
    const star = 1 - seg(t, .3, 2.6), moon = 1 - seg(t, 1.6, 3.4)
    const w1 = eio(seg(t, .6, 1.4)), lamp = eio(seg(t, .9, 1.6)), w3 = eio(seg(t, 1.2, 2.0)), sp = eio(seg(t, 1.4, 2.4))
    const soften = 1 - .3 * seg(t, 6.4, 8.4)
    const dawn = eis(seg(t, 2.0, 4.8)), day = eis(seg(t, 4.6, 7.6)), sun = eio(seg(t, 3.0, 7.2))
    const shade = 1 - eis(seg(t, 2.2, 7.0)), cast = bump(t, 3.4, 7.8)
    op('stars', star)
    op('moonG', moon); E.moonG.setAttribute('transform', `translate(112 ${(96 + (1 - moon) * 8).toFixed(1)})`)
    op('skyDawn', dawn); op('skyDay', day)
    E.sunG.setAttribute('transform', `translate(${lerp(404, 424, sun).toFixed(1)} ${lerp(300, 116, sun).toFixed(1)})`)
    E.sunDisc.setAttribute('fill', mix('#EE9F73', '#EFE3C6', seg(sun, .45, 1)))
    op('sunHalo', sun > 0 ? .9 - .45 * day : 0)
    op('raysWrap', day); op('beamWrap', day); op('warmWrap', day)
    op('cloudsWrap', .3 + .7 * Math.max(dawn * .55, day))
    op('nightShade', .58 * shade); op('dawnCast', .16 * cast)
    op('lWin1', w1 * soften); op('lGlow1', w1 * soften * .8)
    op('lWin3', w3 * soften); op('lGlow3', w3 * soften * .8)
    op('lLamp', lamp * soften); op('lSpill', sp * .7 * soften)
    theme(eis(seg(t, 2.0, 7.4)))
    const b = noBirds ? 0 : seg(t, 5.0, 8.4)
    op('flock', b > 0 && b < 1 ? Math.min(seg(b, 0, .12), 1 - seg(b, .88, 1)) : 0)
    E.flock.setAttribute('transform', `translate(${lerp(20, 540, eis(b)).toFixed(1)} ${(150 - 34 * b + Math.sin(b * 9) * 4).toFixed(1)})`)
  }

  useEffect(() => {
    mounted.current = true
    const svg = sceneRef.current
    if (svg) {
      SCENE_IDS.forEach(id => { const el = svg.querySelector<SVGElement>(`#${id}`); if (el) els.current[id] = el })
      // Measure the path edges so they can draw in
      svg.querySelectorAll<SVGPathElement>('.pedge').forEach(p => {
        try { p.style.setProperty('--len', String(Math.ceil(p.getTotalLength()) + 1)) } catch {}
      })
      if (live) { paint(END, true); svg.classList.add('lit', 'path-on', 'live') }
      else paint(0, true)
    }
    setOrigin(window.location.origin)
    const loop = run.current
    return () => {
      mounted.current = false
      cancelAnimationFrame(loop.raf)
      clearTimeout(toastTimer.current)
      clearTimeout(copyTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Only the shown screen can be reached with the keyboard or a screen reader
  useEffect(() => {
    rootRef.current?.querySelectorAll<HTMLElement>('.swap > .pane').forEach(pane => {
      if (pane.dataset.screen === screen) pane.removeAttribute('inert')
      else pane.setAttribute('inert', '')
    })
    if (screen === 'live' && justLaunched.current) liveTitleRef.current?.focus({ preventScroll: true })
  }, [screen])

  /* ---------- confirmation ---------- */
  function openConfirm() {
    if (run.current.running) return
    lastFocus.current = document.activeElement as HTMLElement | null
    setConfirmOpen(true)
  }
  function closeConfirm(restore: boolean) {
    restoreFocus.current = restore
    setConfirmOpen(false)
  }

  // While the question is open: the page behind it is out of reach, focus stays in it, Esc closes it
  useEffect(() => {
    if (!confirmOpen) {
      if (restoreFocus.current) { restoreFocus.current = false; lastFocus.current?.focus({ preventScroll: true }) }
      return
    }
    const app = appRef.current
    app?.setAttribute('inert', '')
    notYetRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeConfirm(true) }
      if (e.key === 'Tab') {
        const a = notYetRef.current, b = yesRef.current
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b?.focus() }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); app?.removeAttribute('inert') }
  }, [confirmOpen])

  /* ---------- launching: the sunrise and the publishing run together ---------- */
  function startLaunch() {
    if (run.current.running) return   // no second launch while one is running
    lastFocus.current = launchBtnRef.current
    closeConfirm(true)
    setError(null)
    setPublishing(true)
    setAnnounce(`Publishing ${name}.`)

    const rm    = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const dur   = rm ? RM_DUR : END
    const start = performance.now()
    const svg   = sceneRef.current
    let litDone = false, pathDone = false
    run.current = { raf: 0, running: true, animDone: false, outcome: null }

    const step = (now: number) => {
      const p = clamp((now - start) / 1000 / dur), t = p * END
      paint(t, rm)
      if (progressRef.current) progressRef.current.style.width = `${(p * 100).toFixed(1)}%`
      const hint = HINTS[t < 2.4 ? 0 : t < 5.2 ? 1 : 2]
      if (hintRef.current && hintRef.current.textContent !== hint) hintRef.current.textContent = hint
      if (!litDone && t >= 2.0)  { svg?.classList.add('lit'); litDone = true }
      if (!pathDone && t >= 6.3) { svg?.classList.add('path-on'); pathDone = true }
      if (p < 1) run.current.raf = requestAnimationFrame(step)
      else { run.current.animDone = true; settle() }
    }
    run.current.raf = requestAnimationFrame(step)

    const publish: Promise<LaunchResult> = demo
      ? new Promise(resolve => setTimeout(() => resolve({ success: true, slug }), 1500))
      : launchHomestay(token)
    publish
      .then((r): Outcome => (r.success ? { ok: true, slug: r.slug } : { ok: false, message: MESSAGES[r.reason] }))
      .catch((): Outcome => ({ ok: false, message: MESSAGES.publish }))
      .then(outcome => {
        if (!mounted.current || !run.current.running) return
        run.current.outcome = outcome
        settle()
      })
  }

  // Live once both the morning has come and the homestay is published. If the morning comes first,
  // the scene waits there with the button still publishing. A failure stops at once.
  function settle() {
    const r = run.current
    if (!r.running || !r.outcome) return
    if (!r.outcome.ok) { fail(r.outcome.message); return }
    if (r.animDone) finish(r.outcome.slug)
  }

  // Back to night, the Launch button ready again, and the reason shown
  function fail(message: string) {
    cancelAnimationFrame(run.current.raf)
    run.current.running = false
    sceneRef.current?.classList.remove('lit', 'path-on')
    paint(0, true)
    if (progressRef.current) progressRef.current.style.width = '0'
    setPublishing(false)
    setError(message)
    setAnnounce(message)
    launchBtnRef.current?.focus({ preventScroll: true })
  }

  function finish(publishedSlug: string) {
    run.current.running = false
    justLaunched.current = true
    sceneRef.current?.classList.add('lit', 'path-on', 'live')
    setLiveSlug(publishedSlug)
    setPublishing(false)
    setScreen('live')
    setAnnounce('Your homestay is now live on BeNative!')
  }

  /* ---------- after launch ---------- */
  function showToast(message: string) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }
  function fallbackCopy() {
    const input = linkInputRef.current
    if (input) { input.value = url; input.focus(); input.select() }
    showToast('Link selected. Press Ctrl+C or long-press to copy.')
  }
  function copyLink() {
    try {
      if (!navigator.clipboard?.writeText) { fallbackCopy(); return }
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        showToast('Homestay link copied')
        clearTimeout(copyTimer.current)
        copyTimer.current = setTimeout(() => setCopied(false), 2400)
      }, fallbackCopy)
    } catch { fallbackCopy() }
  }

  // Signed in with another account: sign out, then sign in again and come back here
  async function switchAccount() {
    await createClient().auth.signOut()
    window.location.assign(`/login?next=${encodeURIComponent(`/launch/${token}`)}`)
  }

  const loginHref = `/login?next=${encodeURIComponent(`/launch/${token}`)}`
  const homeIcon  = <svg className="ico-home" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>
  const arrowIcon = <svg className="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>

  return (
    <div ref={rootRef} className={`bn-launch ${lora.variable}`} style={live ? MORNING_STYLE : undefined}>
      <div className="app" ref={appRef}>
        <header className="top enter">
          <a className="logo" href="/" target="_blank" rel="noopener" aria-label="BeNative home">
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="14.2" fill="none" stroke="currentColor" strokeWidth="2.8" /><circle cx="22.4" cy="21" r="3.4" fill="currentColor" /></svg>
            <span><b>BeNative</b><small>TRAVEL BEYOND THE GUIDEBOOK</small></span>
          </a>
          <span className="host-chip"><i aria-hidden="true">{hostInitial}</i><span>Host · {name}</span></span>
        </header>

        <main className="main">
          {/* words above the illustration */}
          <div className="swap">
            <div className={`pane${screen === 'ready' ? ' on' : ''}`} data-screen="ready" aria-hidden={screen !== 'ready'}>
              <span className="tag enter" style={enterDelay('.1s')}><span className="dot" />{name} · Profile complete</span>
              <h1 tabIndex={-1} className="enter" style={enterDelay('.18s')}>Your homestay is ready to meet the world!</h1>
              <p className="lede enter" style={enterDelay('.26s')}>You&apos;ve shared the story of your home, your surroundings and the experiences you offer. Now it&apos;s time to welcome travellers.</p>
            </div>
            <div className={`pane${screen === 'live' ? ' on' : ''}`} data-screen="live" aria-hidden={screen !== 'live'}>
              <span className="tag"><span className="dot live" />Live on BeNative</span>
              <h1 tabIndex={-1} ref={liveTitleRef}>Your homestay is now live on BeNative!</h1>
              <p className="lede">A new day, a new beginning. Your doors are now open to travellers.</p>
            </div>
          </div>

          {/* the illustration */}
          <div className="stage enter" style={enterDelay('.3s')}>
            <LaunchScene ref={sceneRef} name={name} live={screen === 'live'} />
          </div>

          {/* actions below the illustration */}
          <div className="swap actions">
            <div className={`pane${screen === 'ready' ? ' on' : ''}`} data-screen="ready" aria-hidden={screen !== 'ready'}>
              {gate?.kind === 'signin' ? (
                <>
                  <a className="btn big enter" style={enterDelay('.5s')} href={loginHref}>
                    {homeIcon}<span>Sign in to Launch</span>{arrowIcon}
                  </a>
                  <p className="hint enter" style={enterDelay('.6s')}>
                    Sign in with <strong>{gate.hostEmail}</strong>, the email saved for your homestay.
                  </p>
                </>
              ) : gate?.kind === 'email' ? (
                <>
                  <button type="button" className="btn big enter" style={enterDelay('.5s')} onClick={switchAccount}>
                    {homeIcon}<span>Use a Different Account</span>{arrowIcon}
                  </button>
                  <p className="hint enter" style={enterDelay('.6s')}>
                    This launch link is for <strong>{gate.hostEmail}</strong>. You&apos;re signed in as {gate.signedInAs}.
                  </p>
                </>
              ) : (
                <>
                  <button
                    ref={launchBtnRef}
                    type="button"
                    className={`btn big enter${publishing ? ' is-publishing' : ''}`}
                    style={enterDelay('.5s')}
                    aria-disabled={publishing || undefined}
                    onClick={openConfirm}
                  >
                    {homeIcon}
                    <svg className="ico-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 1-9 9" /></svg>
                    <span>{publishing ? 'Publishing your homestay…' : 'Launch My Homestay'}</span>
                    {arrowIcon}
                  </button>
                  <div className="progress" aria-hidden="true"><span ref={progressRef} /></div>
                  {error && <p className="launch-error" role="alert">{error}</p>}
                  <p className="hint enter" style={enterDelay('.6s')}>
                    <svg className="pen" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                    {publishing
                      ? <span ref={hintRef}>{HINTS[0]}</span>
                      : <span>Want to change something later? <Link href="/contact" target="_blank">Message us</Link> and we&apos;ll update it for you.</span>}
                  </p>
                </>
              )}
            </div>
            <div className={`pane${screen === 'live' ? ' on' : ''}`} data-screen="live" aria-hidden={screen !== 'live'}>
              <div className="linkrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
                <label className="sr-only" htmlFor="linkInput">Your homestay link</label>
                <input id="linkInput" ref={linkInputRef} type="text" readOnly value={displayLink} />
              </div>
              <div className="btn-row">
                <a className="btn" href={`/homestays/${liveSlug}`} target="_blank" rel="noopener">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                  View My Homestay
                </a>
                <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(hostMessage(url))}`} target="_blank" rel="noopener">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 21l1.6-4.4A8.5 8.5 0 1 1 20.5 12z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.3-1.8-.9-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-.9-1.8L9 9.5z" /></svg>
                  Share on WhatsApp
                </a>
                <button type="button" className="btn ghost" onClick={copyLink}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                  <span>{copied ? 'Link copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">{announce}</p>
        </main>
      </div>

      {/* Confirmation */}
      {confirmOpen && (
        <div className="scrim" onClick={e => { if (e.target === e.currentTarget) closeConfirm(true) }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle" aria-describedby="confirmText">
            <div className="seal" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V5a1 1 0 0 1 1-1h9l3 3v14" /><path d="M14 4v17" /><path d="M2 21h20" /><circle cx="11" cy="13" r=".9" fill="currentColor" /></svg>
            </div>
            <h2 id="confirmTitle">Ready to open your doors to travellers?</h2>
            <p id="confirmText">Your homestay will become visible on BeNative.</p>
            <span className="name">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F4D1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>
              {name}
            </span>
            <div className="modal-actions">
              <button ref={notYetRef} type="button" className="btn ghost" onClick={() => closeConfirm(true)}>Not Yet</button>
              <button ref={yesRef} type="button" className="btn" onClick={startLaunch}>Yes, Launch My Homestay</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toast ? ' on' : ''}`} role="status">{toast}</div>
    </div>
  )
}
