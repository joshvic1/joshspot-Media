import {
  FaComments,
  FaSearch,
  FaCog,
  FaChalkboardTeacher,
  FaBullhorn,
  FaBook,
  FaUsers,
} from "react-icons/fa";

export const services = [
  {
    id: 1,
    title: "30 Minute Consultation",
    price: 12000,
    icon: FaComments,
    description: `
Book 30 minutes with Joshspot to fix ads or marketing issues.

Use this session if you need quick help with your business marketing.

You can use this time to:
- Ask marketing questions
- Fix Meta or TikTok ad account problems
- Troubleshoot campaigns that are not performing
- Get advice on improving your marketing strategy
- Quickly review your ads account

Perfect if you need fast direction or expert answers.
`,
    image: "/images/consultation.jpg",
  },

  {
    id: 2,
    title: "1 Hour Consultation",
    price: 20000,
    icon: FaComments,
    description: `
Book one hour with Joshspot to deeply review and improve marketing.

This is a deeper strategy session where we analyze your situation properly.

During this call we can:
- Review your Meta or TikTok ads account
- Diagnose why your ads are not performing well
- Fix targeting or campaign structure problems
- Plan a better marketing strategy for your business

You are basically buying my time for one full hour.
`,
    image: "/images/consultation-1hr.jpg",
  },

  {
    id: 3,
    title: "TikTok Ads Account Setup",
    price: 20000,
    icon: FaCog,
    description: `
I setup your TikTok ads account properly from scratch.

If you are new to ads or your account is not structured well, I will fix it.

This service includes:
- Ads account setup
- Pixel installation (if needed)
- Proper campaign structure
- Audience targeting setup
- Preparing your account to launch ads

This ensures your ads account is ready to run campaigns correctly.
`,
    image: "/images/ads-setup.jpg",
  },

  {
    id: 4,
    title: "TikTok Ads Training (1-on-1)",
    price: 45000,
    icon: FaChalkboardTeacher,
    description: `
3 days Private training where Joshspot teaches you how to run ads yourself.

This is a personal training session designed to help you understand ads properly.

In this training you will learn:
- How TikTok ads work
- How to Register and setup your TikTok ads account
- How to structure campaigns correctly
- How to target the right audience
- How to scale profitable ads
- How to avoid wasting money on ads

Duration: 3 Days
`,
    image: "/images/ads-training.jpg",
  },

  {
    id: 5,
    title: "TikTok Ads Management",
    dynamicPricing: true,
    priceRange: "Starting From ₦10,000",
    icon: FaBullhorn,
    description: `
Hire Joshspot Media team to run and manage your business ads for a week.
This service is for business owners who want professionals to handle their ads.

We will:
- Setup your campaigns
- Target the right audience
- Optimize ads performance
- Scale profitable campaigns

Pricing depends on your ad budget and project scope.

Businesses must book a consultation first before ads management begins.
`,
    image: "/images/ads-management.jpg",
  },

  {
    id: 6,
    title: "TikTok Ads Manager Course",
    price: 7000,
    icon: FaBook,
    description: `
This is a pre-recorded video  step-by-step tutorial on how to run TikTok ads professionally.

Inside the course you will learn:
- How to register and setup your TikTok ads account
- How to create campaigns
- How to target the right audience
- How to control ad spending
- How to run profitable campaigns

Perfect for beginners who want to start running ads themselves.
`,
    image: "/images/ads-course.jpg",
  },

  {
    id: 8,
    title: "Landing Page + Conversion Course",
    price: 2000,
    icon: FaBook,
    description: `
Learn how to turn ad traffic into paying customers using landing pages.

Running ads alone is not enough. You also need a page that converts.

In this course you will learn:
- How landing pages work
- How to build a simple landing page
- How to connect ads to your landing page
- How to turn visitors into paying customers
`,
    image: "/images/landing-page-course.jpg",
  },

  {
    id: 9,
    title: "Private Marketing Community",
    price: 5000,
    icon: FaUsers,
    description: `
For 5k per month, Join my inner marketing circle to learn marketing and business growth.

Inside the community you will get:
- Marketing insights and strategies
- Campaign breakdowns
- Answers to your marketing questions
- Updates on new marketing tactics

Perfect for business owners and marketers who want to grow faster.
`,
    image: "/images/community.jpg",
  },
];
