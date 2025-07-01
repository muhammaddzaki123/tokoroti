export interface Product {
  $id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  // Perubahan dari 'category' ke 'type'
  type: "Baju" | "Celana" | "Tas" | "Sofenir" | "Other";
  // Menambahkan atribut untuk relasi galeri
  gallery: string[]; // Ini akan menjadi array dari ID dokumen galeri
  // Menggunakan nama relasi yang benar
  agentId: string;
  status: 'active' | 'inactive';
}