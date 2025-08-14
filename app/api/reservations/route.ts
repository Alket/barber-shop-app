import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cache, CACHE_TTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const clientId = searchParams.get('clientId');
    
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    let query: any = {};
    
    if (date) {
      query.date = date;
    }
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    // Cache key per-date to avoid refetching
    const cacheKey = JSON.stringify(query)
    const cached = cache.get<any[]>('reservations', cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const reservations = await db.collection('reservations').find(query).toArray();
    cache.set('reservations', cacheKey, reservations, CACHE_TTL.reservations)
    
    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    const result = await db.collection('reservations').insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    cache.clearNamespace('reservations')
    
    return NextResponse.json({ _id: result.insertedId, ...body });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid reservation ID format' }, { status: 400 });
    }
    
    const result = await db.collection('reservations').updateOne(
      { _id: objectId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    cache.clearNamespace('reservations')
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid reservation ID format' }, { status: 400 });
    }
    
    const result = await db.collection('reservations').deleteOne({ _id: objectId });
    cache.clearNamespace('reservations')
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 });
  }
}
