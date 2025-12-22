import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-b from-white to-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Return Policy</h1>
            <p className="text-lg text-gray-600">
              We want you to love your purchase. If something isn’t right, you can return eligible items within the timeframe below.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/products">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              <Link href="/contact">
                <Button className="bg-black text-white hover:bg-primary hover:text-foreground">Contact Support</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Return Policy</h2>
            <p className="text-sm text-gray-700">The customer is allowed to inspect the product while the courier is present. Once the courier leaves, no returns or exchanges will be accepted. Refunds are accepted only in case of a manufacturing defect. The item must be unworn, unwashed, with original tags attached, and in its original condition. Shipping fees are non-refundable and must be paid even if the order is refused.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Refunds & Processing</h2>
            <p className="text-sm text-gray-700">Refunds are issued to the original payment method after inspection. Please allow 5–10 business days after we receive your return.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Return Shipping</h2>
            <p className="text-sm text-gray-700">Return shipping fees may apply unless the item is defective or we made an error. We’ll provide instructions when you start a return.</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">How to Start a Return</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
            <li>Prepare your order number and the item(s) you wish to return.</li>
            <li>Contact our support team with your request.</li>
            <li>Follow the instructions provided for packing and shipping.</li>
          </ol>
          <div className="mt-4 flex gap-3">
            <a href="mailto:adoore.eg@gmail.com">
              <Button className="bg-black text-white hover:bg-primary hover:text-foreground">Email Support</Button>
            </a>
            <Link href="/contact">
              <Button variant="outline">More Contact Options</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
