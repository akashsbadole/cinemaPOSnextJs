// prisma/seed-events.js
const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding event data...')

  // Create an organizer user
  const organizerPassword = await hash('organizer123', 12)
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@cinepos.com' },
    update: {},
    create: {
      email: 'organizer@cinepos.com',
      name: 'Event Organizer',
      password: organizerPassword,
      role: 'ORGANIZER',
      phone: '+91 98765 43210',
    },
  })

  // Create a venue
  const venue = await prisma.venue.create({
    data: {
      name: 'Grand Stadium',
      location: 'Downtown',
      address: '123 Main Street, City Center',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      capacity: 50000,
    },
  })

  // Create venue sections
  const sections = await Promise.all([
    prisma.venueSection.create({
      data: {
        venueId: venue.id,
        name: 'VIP',
        capacity: 1000,
        coordX: 0,
        coordY: 0,
      },
    }),
    prisma.venueSection.create({
      data: {
        venueId: venue.id,
        name: 'General',
        capacity: 40000,
        coordX: 0,
        coordY: 100,
      },
    }),
  ])

  // Create sample events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Summer Music Festival 2026',
        description: 'A spectacular music festival featuring top artists from around the world. Multiple stages with diverse genres including pop, rock, and electronic music.',
        category: 'FESTIVAL',
        eventType: 'MULTI_DAY',
        startDate: new Date('2026-05-15T18:00:00Z'),
        endDate: new Date('2026-05-17T23:00:00Z'),
        venueId: venue.id,
        organizerId: organizer.id,
        posterUrl: 'https://example.com/poster1.jpg',
        bannerUrl: 'https://example.com/banner1.jpg',
        capacity: 45000,
        refundPolicy: 'PARTIAL',
        status: 'PUBLISHED',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Tech Conference 2026',
        description: 'Leading technology conference bringing together innovators, entrepreneurs, and tech enthusiasts. Sessions on AI, blockchain, cloud computing, and emerging technologies.',
        category: 'CONFERENCE',
        eventType: 'SINGLE_DAY',
        startDate: new Date('2026-06-10T09:00:00Z'),
        endDate: new Date('2026-06-10T18:00:00Z'),
        venueId: venue.id,
        organizerId: organizer.id,
        posterUrl: 'https://example.com/poster2.jpg',
        bannerUrl: 'https://example.com/banner2.jpg',
        capacity: 5000,
        refundPolicy: 'FULL',
        status: 'PUBLISHED',
      },
    }),
  ])

  // Create ticket tiers for events
  for (const event of events) {
    await Promise.all([
      prisma.ticketTier.create({
        data: {
          eventId: event.id,
          sectionId: sections[0].id,
          name: 'VIP Access',
          basePrice: 5000,
          currentPrice: 5000,
          totalCapacity: 500,
          availableCount: 500,
          features: {
            create: [
              { name: 'VIP Seating' },
              { name: 'Meet & Greet' },
              { name: 'Exclusive Merchandise' },
              { name: 'VIP Lounge Access' },
            ],
          },
        },
      }),
      prisma.ticketTier.create({
        data: {
          eventId: event.id,
          sectionId: sections[1].id,
          name: 'General Admission',
          basePrice: 1500,
          currentPrice: 1500,
          totalCapacity: 2000,
          availableCount: 2000,
          features: {
            create: [
              { name: 'Standing Room' },
              { name: 'Basic Amenities' },
            ],
          },
        },
      }),
    ])
  }

  console.log('✅ Event data seeded successfully!')
  console.log(`Created organizer: ${organizer.email}`)
  console.log(`Created venue: ${venue.name}`)
  console.log(`Created ${events.length} events with ticket tiers`)
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })