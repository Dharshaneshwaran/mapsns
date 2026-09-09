import { CampusLocation, CategoryFilter } from "@/types/campus";

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: "a-block",
    name: "SNSCT AI Campus A-Block",
    category: "academic",
    position: {
      lat: 11.1015,
      lng: 77.0270,
    },
    description: "Academic block for AI and Computer Science departments",
    isVerified: false,
  },
  {
    id: "b-block",
    name: "B-Block",
    category: "academic",
    position: {
      lat: 11.1020,
      lng: 77.0275,
    },
    isVerified: false,
  },
  {
    id: "c-block",
    name: "C-Block",
    category: "academic",
    position: {
      lat: 11.1025,
      lng: 77.0280,
    },
    isVerified: false,
  },
  {
    id: "library",
    name: "SNS College Library",
    category: "library",
    position: {
      lat: 11.1018,
      lng: 77.0272,
    },
    isVerified: false,
  },
  {
    id: "canteen",
    name: "Campus Canteen",
    category: "food",
    position: {
      lat: 11.1028,
      lng: 77.0268,
    },
    isVerified: false,
  },
  {
    id: "mess",
    name: "College Mess",
    category: "food",
    position: {
      lat: 11.1035,
      lng: 77.0265,
    },
    isVerified: false,
  },
  {
    id: "playground",
    name: "Sports Ground",
    category: "sports",
    position: {
      lat: 11.1030,
      lng: 77.0278,
    },
    isVerified: false,
  },
  {
    id: "basketball-court",
    name: "Basketball Court",
    category: "sports",
    position: {
      lat: 11.1032,
      lng: 77.0276,
    },
    isVerified: false,
  },
  {
    id: "boys-hostel",
    name: "Boys Hostel",
    category: "hostel",
    position: {
      lat: 11.1038,
      lng: 77.0282,
    },
    isVerified: false,
  },
  {
    id: "girls-hostel",
    name: "Girls Hostel",
    category: "hostel",
    position: {
      lat: 11.1040,
      lng: 77.0284,
    },
    isVerified: false,
  },
  {
    id: "main-gate",
    name: "Main Gate",
    category: "gate",
    position: {
      lat: 11.0998,
      lng: 77.0273,
    },
    isVerified: false,
  },
  {
    id: "back-gate",
    name: "Back Gate",
    category: "gate",
    position: {
      lat: 11.1040,
      lng: 77.0285,
    },
    isVerified: false,
  },
  {
    id: "auditorium",
    name: "College Auditorium",
    category: "auditorium",
    position: {
      lat: 11.1022,
      lng: 77.0266,
    },
    isVerified: false,
  },
  {
    id: "admin-block",
    name: "Administrative Block",
    category: "admin",
    position: {
      lat: 11.1012,
      lng: 77.0268,
    },
    isVerified: false,
  },
  {
    id: "parking",
    name: "Parking Area",
    category: "other",
    position: {
      lat: 11.1005,
      lng: 77.0275,
    },
    isVerified: false,
  },
  {
    id: "temple",
    name: "SNS Lawn Heritage",
    category: "other",
    position: {
      lat: 11.100665597014457,
      lng: 77.02657444378238,
    },
    description: "Traditional Tamil Nadu heritage building at SNS Lawn",
    isVerified: true,
    customIcon: "/vatta_mandalam.png",
  },
  {
    id: "admin-building",
    name: "Admin Building",
    category: "admin",
    position: {
      lat: 11.10009421400155,
      lng: 77.02664133529711,
    },
    description: "Administrative block of SNS College of Technology",
    isVerified: true,
    customIcon: "/admin_building.png",
  },
  {
    id: "heritage-courtyard",
    name: "Heritage Courtyard",
    category: "other",
    position: {
      lat: 11.101011353839342,
      lng: 77.0275747454194,
    },
    description: "Traditional heritage courtyard building on campus",
    isVerified: true,
    customIcon: "/heritage_building.png",
  },
  {
    id: "ihub",
    name: "SNS iNNovation Hub",
    category: "academic",
    position: {
      lat: 11.100081,
      lng: 77.027381,
    },
    description: "Innovation and technology hub at SNS campus",
    isVerified: true,
    customIcon: "/ihub.png",
  },
];

export const CATEGORY_FILTERS: CategoryFilter[] = [
  { id: "all", label: "Explore", icon: "🗺️" },
  { id: "academic", label: "Blocks", icon: "🏛️" },
  { id: "food", label: "Food", icon: "🍽️" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "hostel", label: "Hostels", icon: "🏠" },
  { id: "gate", label: "Gates", icon: "🚪" },
];
