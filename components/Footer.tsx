import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[#ececec] text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl text-black"
            style={{ fontFamily: "'Adore Modern Serif', serif" }}
            >ADOORE</h3>
            <p className="text-black mb-4">
              Your one-stop destination for the latest fashion trends and quality clothing.
            </p>
            <div className="flex space-x-4">
              {/* <a href="#" className="text-black hover:text-white">
                Facebook
              </a> */}
              <a href="https://www.tiktok.com/@adoore.eg" className="text-black hover:text-white">
                TikTok
              </a>
              <a href="https://www.instagram.com/adoore.eg?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="text-black hover:text-white">
                Instagram
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-black hover:text-white">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-black hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-black hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shipping" className="text-black hover:text-white">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-black hover:text-white">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-black hover:text-white">
                  Size Guide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-black">
            © 2024 ADOORE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
