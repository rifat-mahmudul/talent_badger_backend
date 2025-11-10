# Engineering Consulting Platform - সম্পূর্ণ ডকুমেন্টেশন

## প্রজেক্ট সম্পর্কে (বাংলায়)

এটি একটি **Engineering Consulting Platform** যেখানে:
- Engineers তাদের সার্ভিস প্রদান করে
- Clients Engineer দের হায়ার করে প্রজেক্টের জন্য
- Admin সবকিছু নিয়ন্ত্রণ করে

এটি Upwork বা Fiverr এর মতো, শুধু Engineering সার্ভিসের জন্য।

---

## সিস্টেমের তিনটি ব্যবহারকারী (Role)

### 1. ADMIN (প্রশাসক)
**কাজ:**
- সব ইউজার ম্যানেজ করা (Add, Edit, Delete)
- সব প্রজেক্ট দেখা এবং নিয়ন্ত্রণ করা
- সার্ভিস রিকোয়েস্ট অনুমোদন/প্রত্যাখ্যান করা
- টিম অনুমোদন করা
- ব্লগ পোস্ট লেখা এবং প্রকাশ করা
- ড্যাশবোর্ড স্ট্যাটিস্টিক্স দেখা

**Permission Level:** সর্বোচ্চ

---

### 2. ENGINEER (ইঞ্জিনিয়ার)
**কাজ:**
- নিজের প্রোফাইল তৈরি এবং এডিট করা
- নিজের প্রজেক্ট তৈরি করা
- ক্লায়েন্টের প্রজেক্ট দেখে গ্রহণ করা
- প্রজেক্ট স্ট্যাটাস আপডেট করা (In Progress → Completed)
- কল বুকিং করা
- রিকোয়েস্ট গ্রহণ করা

**Permission Level:** মাঝারি

---

### 3. CLIENT (ক্লায়েন্ট)
**কাজ:**
- নিজের প্রোফাইল তৈরি এবং এডিট করা
- নতুন প্রজেক্ট পোস্ট করা (Engineer দের জন্য)
- প্রজেক্ট স্ট্যাটাস ট্র্যাক করা
- Engineer কে রিকোয়েস্ট পাঠানো
- কল বুকিং করা
- একই Engineer কে "Hire Again" করা

**Permission Level:** সীমিত

---

### সাধারণ Error Codes
- `400` - Bad Request (ভুল ডাটা পাঠানো হয়েছে)
- `401` - Unauthorized (লগইন করতে হবে)
- `403` - Forbidden (এই কাজ করার অনুমতি নেই)
- `404` - Not Found (ডাটা পাওয়া যায়নি)
- `500` - Server Error (সার্ভারের সমস্যা)

---

## Installation এবং Setup

### প্রয়োজনীয় জিনিস
- Node.js (v16 বা উপরে)
- MongoDB (Local বা Cloud)
- npm বা yarn

### স্টেপ ১: প্রজেক্ট ক্লোন করা
\`\`\`bash
git clone <your-project-url>
cd backend
\`\`\`

### স্টেপ २: Dependencies ইনস্টল করা
\`\`\`bash
npm install
\`\`\`

### স্টেপ ३: Environment Variables সেটআপ
\`\`\`
.env ফাইল তৈরি করুন এবং নিচের জিনিস যোগ করুন:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/engineering-platform
JWT_SECRET=your_secret_key_here
NODE_ENV=development
\`\`\`

### স্টেপ ४: সার্ভার চালু করা
\`\`\`bash
npm run dev
\`\`\`

**আউটপুট হবে:**
\`\`\`
Server running on http://localhost:5000
MongoDB connected successfully
\`\`\`

---

## টাইমলাইন এবং মাইলস্টোন

### সপ্তাহ ১-२: সেটআপ এবং Testing
- Backend সেটআপ করা
- Database স্ট্রাকচার তৈরি করা
- API টেস্টিং (Postman এ)

### সপ্তাহ ३-४: Frontend Integration
- Login/Register পেজ তৈরি
- Dashboard তৈরি
- প্রজেক্ট ম্যানেজমেন্ট পেজ

### সপ্তাহ ५-६: Additional Features
- Notification সিস্টেম
- Review/Rating সিস্টেম
- Payment Integration (Stripe)

---

## সাপোর্ট এবং সমস্যা সমাধান

### সাধারণ সমস্যা

**MongoDB Connection Error:**
\`\`\`
সমাধান: MongoDB আপনার কম্পিউটারে চলছে কিনা চেক করুন
mongod コマンド চালান
\`\`\`

**Port Already in Use:**
\`\`\`
সমাধান: অন্য একটি port ব্যবহার করুন
.env এ PORT=3001 সেট করুন
\`\`\`

**JWT Token Error:**
\`\`\`
সমাধান: আপনার token expire হয়েছে, নতুন করে login করুন
\`\`\`

---

## মূল ধারণাগুলি মনে রাখবেন

1. প্রতিটি API তে JWT Token প্রয়োজন (auth API ছাড়া)
2. প্রতিটি ইউজারের আলাদা Permission রয়েছে
3. প্রজেক্ট Status কখনো আগে যায় না (backward move নয়)
4. Client এবং Engineer একই সাথে একটি প্রজেক্টে থাকতে পারে না

---

## কমপ্লিট হয়েছে!

এই ডকুমেন্টেশন দিয়ে আপনার সম্পূর্ণ Backend সিস্টেম বুঝা যাবে। যদি কোনো প্রশ্ন থাকে তাহলে জিজ্ঞাসা করুন!

---

**Last Updated:** 2025-11-09
**Version:** 1.0
**Status:** Ready for Production
