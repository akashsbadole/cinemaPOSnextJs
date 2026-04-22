// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Users
  const adminPass = await bcrypt.hash('admin123', 10);
  const clerkPass = await bcrypt.hash('clerk123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cinepos.com' },
    update: {},
    create: { name: 'Super Admin', email: 'admin@cinepos.com', password: adminPass, role: 'SUPER_ADMIN', phone: '9999999999' },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@cinepos.com' },
    update: {},
    create: { name: 'Rajesh Kumar', email: 'manager@cinepos.com', password: clerkPass, role: 'MANAGER', phone: '9888888888' },
  });

  const clerk = await prisma.user.upsert({
    where: { email: 'clerk@cinepos.com' },
    update: {},
    create: { name: 'Priya Singh', email: 'clerk@cinepos.com', password: clerkPass, role: 'CLERK', phone: '9777777777' },
  });

  // Theater
  const theater = await prisma.theater.upsert({
    where: { id: 'theater-1' },
    update: {},
    create: {
      id: 'theater-1',
      name: 'CinePlex Multiplex',
      location: 'Pune, Maharashtra',
      address: 'FC Road, Shivajinagar, Pune 411005',
      phone: '020-12345678',
      email: 'info@cineplex.com',
    },
  });

  // Screens with seats
  const screenDefs = [
    { id: 'screen-1', name: 'IMAX Hall 1', totalSeats: 180 },
    { id: 'screen-2', name: 'Hall 2 (3D)', totalSeats: 120 },
    { id: 'screen-3', name: 'Hall 3 (2D)', totalSeats: 150 },
    { id: 'screen-4', name: '4DX Hall', totalSeats: 80 },
  ];

  for (const sd of screenDefs) {
    const screen = await prisma.screen.upsert({
      where: { id: sd.id },
      update: {},
      create: { id: sd.id, theaterId: theater.id, name: sd.name, totalSeats: sd.totalSeats },
    });

    // Generate seats
    const rows = ['A','B','C','D','E','F','G','H','I','J'];
    const seatsPerRow = Math.ceil(sd.totalSeats / rows.length);
    let seatCount = 0;

    for (let r = 0; r < rows.length && seatCount < sd.totalSeats; r++) {
      const row = rows[r];
      const type = r < 2 ? 'VIP' : r < 5 ? 'PREMIUM' : 'REGULAR';
      const count = Math.min(seatsPerRow, sd.totalSeats - seatCount);

      for (let n = 1; n <= count; n++) {
        await prisma.seat.upsert({
          where: { screenId_row_number: { screenId: screen.id, row, number: n } },
          update: {},
          create: {
            screenId: screen.id,
            row,
            number: n,
            type,
            coordX: (n - count / 2) * 0.8,
            coordY: r * 0.5,
            coordZ: r * 1.2,
          },
        });
        seatCount++;
      }
    }
    console.log(`✅ Screen ${sd.name}: ${seatCount} seats`);
  }

  // Movies
  const movies = [
    { id: 'movie-1', title: 'Dune: Awakening', description: 'Epic sci-fi saga on Arrakis continues.', duration: 155, genre: 'Sci-Fi', language: 'English', format: 'IMAX', rating: 'UA', releaseDate: new Date('2024-11-15') },
    { id: 'movie-2', title: 'Blade Runner 2099', description: 'Neo-noir dystopia in future Los Angeles.', duration: 140, genre: 'Sci-Fi', language: 'English', format: '3D', rating: 'A', releaseDate: new Date('2024-12-01') },
    { id: 'movie-3', title: 'Pushpa 3: The Rule', description: 'Pushpa Raj returns with vengeance.', duration: 165, genre: 'Action', language: 'Hindi', format: '2D', rating: 'UA', releaseDate: new Date('2024-12-25') },
    { id: 'movie-4', title: 'Avatar: Fire & Ice', description: 'New chapter in the Avatar universe.', duration: 175, genre: 'Fantasy', language: 'English', format: '4DX', rating: 'U', releaseDate: new Date('2025-01-10') },
    { id: 'movie-5', title: 'RRR 2', description: 'Return of Raju and Bheem.', duration: 180, genre: 'Action', language: 'Telugu', format: '2D', rating: 'UA', releaseDate: new Date('2025-02-01') },
  ];

  for (const m of movies) {
    await prisma.movie.upsert({ where: { id: m.id }, update: {}, create: m });
  }

  // Shows (today and next 3 days) - use local timezone
  const now = new Date();
  const localOffset = now.getTimezoneOffset() * 60 * 1000;
  const today = new Date(now.getTime() - localOffset);
  today.setHours(0, 0, 0, 0);

  const showDefs = [
    { movieId: 'movie-1', screenId: 'screen-1', hour: 10, min: 0, priceVip: 800, pricePremium: 500, priceRegular: 350 },
    { movieId: 'movie-1', screenId: 'screen-1', hour: 14, min: 30, priceVip: 800, pricePremium: 500, priceRegular: 350 },
    { movieId: 'movie-1', screenId: 'screen-1', hour: 19, min: 0, priceVip: 1000, pricePremium: 700, priceRegular: 450 },
    { movieId: 'movie-2', screenId: 'screen-2', hour: 11, min: 0, priceVip: 650, pricePremium: 400, priceRegular: 250 },
    { movieId: 'movie-2', screenId: 'screen-2', hour: 15, min: 0, priceVip: 650, pricePremium: 400, priceRegular: 250 },
    { movieId: 'movie-3', screenId: 'screen-3', hour: 9, min: 30, priceVip: 500, pricePremium: 300, priceRegular: 180 },
    { movieId: 'movie-3', screenId: 'screen-3', hour: 13, min: 0, priceVip: 500, pricePremium: 300, priceRegular: 180 },
    { movieId: 'movie-3', screenId: 'screen-3', hour: 17, min: 30, priceVip: 600, pricePremium: 350, priceRegular: 200 },
    { movieId: 'movie-4', screenId: 'screen-4', hour: 12, min: 0, priceVip: 1200, pricePremium: 900, priceRegular: 600 },
    { movieId: 'movie-4', screenId: 'screen-4', hour: 20, min: 0, priceVip: 1500, pricePremium: 1100, priceRegular: 750 },
    { movieId: 'movie-5', screenId: 'screen-3', hour: 10, min: 30, priceVip: 550, pricePremium: 320, priceRegular: 190 },
    { movieId: 'movie-5', screenId: 'screen-3', hour: 21, min: 0, priceVip: 650, pricePremium: 400, priceRegular: 230 },
  ];

  let showIdx = 0;
  for (let day = 0; day < 4; day++) {
    for (const sd of showDefs) {
      const movie = movies.find(m => m.id === sd.movieId);
      const startTime = new Date(today);
      startTime.setDate(startTime.getDate() + day);
      startTime.setHours(sd.hour, sd.min, 0, 0);
      const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000);

      const now = new Date();
      let status = 'SCHEDULED';
      if (startTime <= now && endTime > now) status = 'LIVE';
      if (endTime <= now) status = 'COMPLETED';

      await prisma.show.create({
        data: {
          movieId: sd.movieId,
          screenId: sd.screenId,
          startTime,
          endTime,
          status,
          priceVip: sd.priceVip,
          pricePremium: sd.pricePremium,
          priceRegular: sd.priceRegular,
        },
      }).catch(() => {}); // ignore duplicate
      showIdx++;
    }
  }
  console.log(`✅ Created ${showIdx} shows`);

  // Coupons
  await prisma.coupon.upsert({
    where: { code: 'FIRST50' },
    update: {},
    create: { code: 'FIRST50', type: 'PERCENT', value: 50, minAmount: 500, maxDiscount: 200, usageLimit: 100 },
  });
  await prisma.coupon.upsert({
    where: { code: 'FLAT100' },
    update: {},
    create: { code: 'FLAT100', type: 'FLAT', value: 100, minAmount: 300 },
  });
  await prisma.coupon.upsert({
    where: { code: 'VIP200' },
    update: {},
    create: { code: 'VIP200', type: 'FLAT', value: 200, minAmount: 800 },
  });

  console.log('✅ Coupons created');

  // Sample bookings for reports
  const shows = await prisma.show.findMany({ where: { status: 'COMPLETED' }, take: 10, include: { screen: { include: { seats: true } } } });
  let bookingCount = 0;
  for (const show of shows.slice(0, 5)) {
    const seats = show.screen.seats.slice(0, Math.floor(Math.random() * 8) + 2);
    const totalAmount = seats.reduce((sum, s) => {
      const price = s.type === 'VIP' ? show.priceVip : s.type === 'PREMIUM' ? show.pricePremium : show.priceRegular;
      return sum + price;
    }, 0);
    const ref = `BK${Date.now()}${bookingCount}`.slice(0, 10).toUpperCase();
    const booking = await prisma.booking.create({
      data: {
        bookingRef: ref,
        showId: show.id,
        customerName: ['Amit Shah', 'Neha Patel', 'Ravi Kumar', 'Sunita Rao', 'Vikram Singh'][bookingCount % 5],
        customerPhone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        status: 'CONFIRMED',
        totalAmount,
        finalAmount: totalAmount,
        channel: Math.random() > 0.5 ? 'POS' : 'ONLINE',
        bookingSeats: {
          create: seats.map(s => ({
            seatId: s.id,
            price: s.type === 'VIP' ? show.priceVip : s.type === 'PREMIUM' ? show.pricePremium : show.priceRegular,
          })),
        },
        payment: {
          create: {
            method: ['CASH', 'UPI', 'CARD'][Math.floor(Math.random() * 3)],
            amount: totalAmount,
            status: 'COMPLETED',
            paidAt: show.startTime,
          },
        },
      },
    });
    bookingCount++;
  }
  console.log(`✅ ${bookingCount} sample bookings created`);
  console.log('\n🎬 Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@cinepos.com / admin123');
  console.log('  Manager: manager@cinepos.com / clerk123');
  console.log('  Clerk:   clerk@cinepos.com / clerk123');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
