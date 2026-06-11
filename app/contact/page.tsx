import ContactForm from './ContactForm'

export default function ContactPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Contact Us</h1>
        <p className="text-stone-500 text-sm mb-8">We'd love to hear from you. Send us a message and we'll get back to you soon.</p>
        <ContactForm />
      </div>
    </div>
  )
}
