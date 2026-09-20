import {
  FaBullhorn,
  FaChalkboardTeacher,
  FaComments,
  FaSearch,
  FaUsers,
  FaYoutube,
  FaPen,
  FaVideo,
} from "react-icons/fa";

export const WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029VbDEhCQAjPXDyKGgxw0K";
export const YOUTUBE_CHANNEL_URL = "https://youtube.com/@joshspot_tv";
export const META_ADS_TRAINING_URL =
  "https://youtube.com/playlist?list=PLiF2fraj3mTfHrONCT50CFUZMCOp8jnam&si=Gm6Tue4nsQPk--Jh";
export const TIKTOK_ADS_TRAINING_URL =
  "https://youtube.com/playlist?list=PLiF2fraj3mTcolRwvw4QsPTDO_4xWVSs1&si=o6kD8hLfjUfny2xr";

export const services = [
  {
    id: 1,
    slug: "consultation",
    title: "Book Consultation",
    eyebrow: "Strategy call",
    priceRange: "From ₦30,000",
    icon: FaComments,
    image: "/images/consult.jpg",
    description:
      "Book a focused session with Josh to discuss any ads or business growth-related issue, so you can get clear direction on your next marketing move.",
    highlights: [
      "Ask direct marketing questions",
      "Review TikTok or Meta ad issues",
      "Get practical next steps for your business",
    ],
    bookingQuestion: "How long do you want the consultation to be?",
    options: [
      { label: "30 mins", price: 30000 },
      { label: "1 hr", price: 50000 },
      { label: "2 hrs", price: 80000 },
    ],
  },
  {
    id: 2,
    slug: "ads-account-audit",
    title: "Ads Account Audit",
    eyebrow: "Account diagnosis",
    price: 20000,
    icon: FaSearch,
    image: "/images/ads-management.jpg",
    description:
      "We’ll log into your ads account and personally investigate why your ads or a particular setting aren’t working, then explain what needs to be fixed.",
    bookingQuestion: "Which platform should we audit?",
    requireOptionSelection: true,
    options: [
      { label: "Meta", price: 20000 },
      { label: "TikTok", price: 20000 },
    ],
    highlights: [
      "Campaign and structure review",
      "Pixel and tracking checks",
      "Clear improvement recommendations",
    ],
  },
  {
    id: 3,
    slug: "ads-account-setup",
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
    slug: "private-ads-training",
    title: "Ads Training (1 on 1)",
    eyebrow: "Private training",
    priceRange: "From ₦100,000",
    icon: FaChalkboardTeacher,
    image: "/images/ads-training.jpg",
    description:
      "A private three-day training with Josh, one hour per day. We’ll cover how to set up, launch, manage and improve ads by yourself.",
    highlights: [
      "Three days of private training, one hour per day",
      "Private guidance and feedback",
      "Learn campaign setup, targeting, and scaling",
    ],
    bookingQuestion: "Which platform do you want to learn?",
    options: [
      { label: "TikTok (1 on 1)", price: 100000 },
      { label: "Meta (1 on 1)", price: 100000 },
      { label: "TikTok and Meta", price: 150000 },
    ],
  },
  {
    id: 8,
    slug: "video-ad-scripts",
    title: "Video Ad Scripts",
    eyebrow: "Content scripts",
    price: 20000,
    icon: FaPen,
    image: "/images/video-ad-scripts.svg",
    description: "We’ll write your video copy word for word, whether it’s a voiceover or a video script, with an attention-grabbing opening and a clear message that gives people a reason to buy.",
    highlights: ["Word-for-word video or voiceover copy", "An attention-grabbing opening", "A clear message and call to action"],
    externalLink: "/video-script",
    ctaLabel: "Book service",
  },
  {
    id: 9,
    slug: "promo-video-with-josh",
    title: "Promo Video with Josh",
    eyebrow: "One-minute video",
    price: 100000,
    icon: FaVideo,
    image: "/images/joshua.png",
    description: "Let Josh create a one-minute video talking about your product or service. I’ll put the right words together and present your business in a way that grabs attention.",
    highlights: ["One-minute video presented by Josh", "Copy written around your product or service", "An attention-grabbing message for your business"],
  },
  {
    id: 5,
    slug: "marketing-community",
    title: "Private Marketing Community",
    eyebrow: "Community",
    priceLabel: "Free",
    icon: FaUsers,
    image: "/images/community.jpg",
    description:
      "Join the private marketing community for practical business growth ideas, campaign insights, and regular marketing updates.",
    highlights: [
      "Marketing insights",
      "Campaign breakdowns",
      "Community updates",
    ],
    externalLink: WHATSAPP_CHANNEL_URL,
    ctaLabel: "Join Now",
    resource: true,
  },
  {
    id: 6,
    slug: "free-tiktok-training",
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
    externalLink: TIKTOK_ADS_TRAINING_URL,
    ctaLabel: "Watch Free Training",
    resource: true,
    featuredResource: true,
  },
  {
    id: 7,
    slug: "free-meta-training",
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
    externalLink: META_ADS_TRAINING_URL,
    ctaLabel: "Watch Free Training",
    resource: true,
    featuredResource: true,
  },
];
