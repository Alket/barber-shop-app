import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { cache, CACHE_TTL } from '@/lib/cache';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    // Try cache first
    const cached = cache.get<any>('settings', 'singleton')
    if (cached) return NextResponse.json(cached)

    // Get the first settings document (assuming single settings record)
    const settings = await db.collection('settings').findOne({});
    
    if (!settings) {
      // Return default settings if none exist
      const defaultSettings = {
        businessName: "Elite Barber Shop",
        phone: "(555) 123-4567",
        email: "info@elitebarbershop.com",
        address: "123 Main Street, City, State 12345",
        startHour: 9,
        endHour: 18,
        appointmentDuration: 30,
        workingDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: false,
        },
        services: [
          { id: "1", name: "Haircut", duration: 30, price: 25 },
          { id: "2", name: "Beard Trim", duration: 15, price: 15 },
          { id: "3", name: "Haircut + Beard", duration: 45, price: 35 },
          { id: "4", name: "Shampoo & Style", duration: 20, price: 20 },
          { id: "5", name: "Hot Towel Shave", duration: 30, price: 30 },
        ]
      };
      
      cache.set('settings', 'singleton', defaultSettings, CACHE_TTL.settings)
      return NextResponse.json(defaultSettings);
    }
    
    cache.set('settings', 'singleton', settings, CACHE_TTL.settings)
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // Remove immutable _id if present to avoid MongoDB update errors
    const { _id, ...updateData } = body || {};
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    // Upsert settings (create if doesn't exist, update if it does)
    const result = await db.collection('settings').updateOne(
      {}, // empty filter to match any document
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    cache.clearNamespace('settings')
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
