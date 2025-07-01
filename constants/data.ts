import icons from "./icons";
import images from "./images";

export const categories = [
  { title: "All", category: "All" },
  { title: "roti", category: "roti" },
  { title: "bolu", category: "bolu" },
];

export const settings = [
  {
    title: "Dashboard",
    icon: icons.dashboard,
    route: "/dashboard",
  },
  {
    title: "Profil",
    icon: icons.user,
    route: "/profile-detail",
  },
  {
    title: "Keranjang",
    icon: icons.cart,
    route: "/keranjang",
  },
  {
    title: "Alamat Pengiriman",
    icon: icons.alamat,
    route: "/address-manager",
  },
];
