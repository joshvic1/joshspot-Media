import {
  FaBullhorn,
  FaChalkboardTeacher,
  FaComments,
  FaSearch,
  FaUsers,
  FaYoutube,
} from "react-icons/fa";

export const WHATSAPP_CHANNEL_URL = "https://wa.me/234XXXXXXXXXX";
export const YOUTUBE_CHANNEL_URL = "https://youtube.com/@joshspot_tv";

export const services = [
  {
    id: 1,
    title: "Book Consultation",
    eyebrow: "Strategy call",
    priceRange: "From ₦15,000",
    icon: FaComments,
    image: "/images/consult.jpg",
    description:
      "Book a focused session with Joshspot to diagnose ads issues, review your funnel, or get clear direction for your next marketing move.",
    highlights: [
      "Ask direct marketing questions",
      "Review TikTok or Meta ad issues",
      "Get practical next steps for your business",
    ],
    bookingQuestion: "How long do you want the consultation to be?",
    options: [
      { label: "30 mins", price: 15000 },
      { label: "1 hr", price: 25000 },
      { label: "2 hrs", price: 40000 },
    ],
  },
  {
    id: 2,
    title: "Ads Account Audit",
    eyebrow: "Account diagnosis",
    price: 20000,
    icon: FaSearch,
    image: "/images/ads-management.jpg",
    description:
      "Get your TikTok or Meta ads account reviewed properly so you know what is broken, what to fix, and how to improve performance.",
    highlights: [
      "Campaign and structure review",
      "Pixel and tracking checks",
      "Clear improvement recommendations",
    ],
  },
  {
    id: 3,
    title: "TikTok/Meta Ads Account Setup",
    eyebrow: "Done-for-you setup",
    priceRange: "From ₦20,000",
    icon: FaBullhorn,
    image: "/images/ads-setup.jpg",
    description:
      "Let the team setup your ads account correctly from scratch, including the right structure for launching campaigns with confidence.",
    highlights: [
      "Account setup and structure",
      "Platform-specific guidance",
      "Ready-to-launch foundation",
    ],
    bookingQuestion: "Which ads account should we setup?",
    options: [
      { label: "TikTok only", price: 20000 },
      { label: "Meta only", price: 30000 },
      { label: "TikTok and Meta", price: 50000 },
    ],
  },
  {
    id: 4,
    title: "Ads Training (1 on 1)",
    eyebrow: "Private training",
    priceRange: "From ₦60,000",
    icon: FaChalkboardTeacher,
    image: "/images/ads-training.jpg",
    description:
      "A private 3-day training experience that teaches you how to setup, launch, manage, and improve ads yourself.",
    highlights: [
      "3 days training for each platform",
      "Private guidance and feedback",
      "Learn campaign setup, targeting, and scaling",
    ],
    bookingQuestion: "Which platform do you want to learn?",
    options: [
      { label: "TikTok (1 on 1)", price: 60000 },
      { label: "Meta (1 on 1)", price: 60000 },
      { label: "TikTok and Meta", price: 100000 },
    ],
  },
  {
    id: 5,
    title: "Private Marketing Community",
    eyebrow: "Community",
    priceLabel: "Free",
    icon: FaUsers,
    image: "/images/community.jpg",
    description:
      "Join the private marketing community for practical business growth ideas, campaign insights, and regular marketing updates.",
    highlights: ["Marketing insights", "Campaign breakdowns", "Community updates"],
    externalLink: WHATSAPP_CHANNEL_URL,
    ctaLabel: "Join Now",
    resource: true,
  },
  {
    id: 6,
    title: "TikTok Ads Training",
    eyebrow: "Free class",
    priceLabel: "Free training",
    icon: FaYoutube,
    image: "/images/ads-course.jpg",
    description:
      "Watch the free TikTok ads training and learn the basics of setting up, launching, and understanding TikTok campaigns.",
    highlights: [
      "Beginner-friendly walkthrough",
      "TikTok account setup basics",
      "Campaign launch guidance",
    ],
    externalLink: YOUTUBE_CHANNEL_URL,
    ctaLabel: "Watch Free Training",
    resource: true,
    featuredResource: true,
  },
  {
    id: 7,
    title: "Meta Ads Training",
    eyebrow: "Free class",
    priceLabel: "Free training",
    icon: FaYoutube,
    image: "/images/landing-page-course.jpg",
    description:
      "Watch the free Meta ads training and learn how Meta campaigns work, from setup to targeting and campaign structure.",
    highlights: [
      "Meta campaign fundamentals",
      "Targeting and structure basics",
      "Free learning resource",
    ],
    externalLink: YOUTUBE_CHANNEL_URL,
    ctaLabel: "Watch Free Training",
    resource: true,
    featuredResource: true,
  },
];
