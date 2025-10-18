# E-Store - E-commerce Clothing Store

A full-featured e-commerce clothing store built with Next.js 15, Supabase (PostgreSQL), and Stripe payment integration.

## Features

- 🛍️ **Product Catalog**: Browse products with filtering by category, price, size, and color
- 🛒 **Shopping Cart**: Add/remove items, quantity management, persistent cart for logged-in users
- 💳 **Paymob Payment**: Secure checkout with Paymob integration
- 👤 **User Authentication**: Sign up, sign in, and user management with Supabase Auth
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- 🎨 **Product Variants**: Support for different sizes and colors with stock management
- 🔐 **Admin Panel**: Manage products, orders, and customers
- 📦 **Order Management**: Track orders and update status
- 🚚 **Guest Checkout**: Support for both registered users and guest checkout

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Paymob
- **State Management**: React Context API
- **UI Components**: Custom components with Lucide React icons
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Paymob account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd e-store
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Go to Settings > Database to get your service role key
4. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor

### 3. Set up Paymob

1. Create a Paymob account at [paymob.com](https://paymob.com)
2. Get your API key, client secret, and HMAC key from the Paymob dashboard
3. Set up webhooks (optional for development)

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Paymob Configuration
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_CLIENT_SECRET=your_paymob_client_secret
PAYMOB_HMAC_KEY=your_paymob_hmac_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **products**: Product information (name, description, price, category)
- **product_variants**: Size and color variants with stock quantities
- **product_images**: Product images with primary image designation
- **orders**: Customer orders with shipping information
- **order_items**: Individual items within orders
- **cart_items**: Shopping cart items (for both users and guests)

## Project Structure

```
e-store/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel pages
│   ├── auth/              # Authentication pages
│   ├── cart/              # Shopping cart page
│   ├── checkout/          # Checkout and success pages
│   ├── orders/            # User order history
│   ├── products/          # Product listing and detail pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   └── ui/               # Basic UI components
├── contexts/             # React contexts (Auth, Cart)
├── lib/                  # Utility functions and configurations
│   ├── supabase/         # Supabase client setup
│   └── stripe.ts         # Stripe configuration
└── supabase-schema.sql   # Database schema
```

## Key Features Implementation

### Authentication
- Supabase Auth integration
- Protected routes for admin panel
- Guest and authenticated user support

### Shopping Cart
- Context-based state management
- Persistent cart for logged-in users
- Session-based cart for guests
- Real-time quantity updates

### Product Management
- Product variants (size, color, stock)
- Image gallery with primary image selection
- Category-based filtering
- Search functionality

### Payment Processing
- Paymob Checkout integration
- Secure payment handling
- Order creation after successful payment
- Guest checkout support

### Admin Panel
- Product CRUD operations
- Order management
- Customer overview
- Dashboard with statistics

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Environment Variables for Production

Make sure to set these environment variables in your production environment:

- All variables from `.env.local`
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Set up Paymob webhooks for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@estore.com or create an issue in the repository.