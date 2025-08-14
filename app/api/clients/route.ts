import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { cache, CACHE_TTL } from '@/lib/cache';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    const cacheKey = 'all'
    const cached = cache.get<any[]>('clients', cacheKey)
    if (cached) return NextResponse.json(cached)

    const clients = await db.collection('clients').find({}).toArray();
    cache.set('clients', cacheKey, clients, CACHE_TTL.clients)
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    const result = await db.collection('clients').insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    cache.clearNamespace('clients')
    return NextResponse.json({ _id: result.insertedId, ...body });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }
    
    const result = await db.collection('clients').updateOne(
      { _id: objectId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    cache.clearNamespace('clients')
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}
