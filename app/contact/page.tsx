import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Get in touch</h1>
            <p className="text-lg text-gray-600">
              Questions about an order, product sizing, or shipping? We’re here to help.
            </p>
            <div className="mt-8 flex gap-3">
              <a href="mailto:support@example.com">
                <Button className="bg-black text-white hover:bg-primary hover:text-foreground">Email Support</Button>
              </a>
              <Link href="/about">
                <Button variant="outline">About Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-900" />
              </div>
              <h3 className="font-semibold text-gray-900">Customer Support</h3>
            </div>
            <p className="text-sm text-gray-700">support@example.com</p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-900" />
              </div>
              <h3 className="font-semibold text-gray-900">Phone</h3>
            </div>
            <p className="text-sm text-gray-700">+20 123 456 7890</p>
          </div>

          {/* <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-900" />
              </div>
              <h3 className="font-semibold text-gray-900">Address</h3>
            </div>
            <p className="text-sm text-gray-700">123 Fashion St, Cairo, EG</p>
          </div> */}

          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-900" />
              </div>
              <h3 className="font-semibold text-gray-900">Hours</h3>
            </div>
            <p className="text-sm text-gray-700">Sat–Thu: 9:00–18:00</p>
            <p className="text-sm text-gray-700">Fri: Closed</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-lg border bg-white p-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-xl font-semibold text-gray-900">Need quick assistance?</h3>
            <p className="text-gray-600">Email our support team and we’ll respond as soon as possible.</p>
          </div>
          <a href="mailto:support@example.com">
            <Button className="bg-black text-white hover:bg-primary hover:text-foreground">Contact Support</Button>
          </a>
        </div>
      </section>
    </div>
  );
}
