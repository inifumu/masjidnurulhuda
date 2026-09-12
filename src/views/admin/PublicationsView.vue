<template>
  <nav aria-label="Halaman Publikasi"><ul>
    <li><RouterLink to="/admin/publikasi/kabar-masjid">Kabar masjid</RouterLink></li>
    <li><RouterLink to="/admin/publikasi/kegiatan">Kegiatan</RouterLink></li>
    <li><RouterLink to="/admin/publikasi/kritik-saran">Kritik &amp; saran</RouterLink></li>
  </ul></nav>
  <RouterView />
</template>
