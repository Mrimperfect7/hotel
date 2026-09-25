'use client';
import { Map, MapPin } from 'lucide-react';

const PLACES = [
  { id: 'p1', name: 'Guruvayoor Temple', category: 'Temple', desc: 'The main Sri Krishna Temple.', distance: '0 m', type: 'TEMPLE' },
  { id: 'p2', name: 'Mammiyoor Temple', category: 'Temple', desc: 'Historic Shiva temple, a must-visit before Guruvayoor.', distance: '1.2 km', type: 'TEMPLE' },
  { id: 'p3', name: 'Anakotta (Elephant Camp)', category: 'Cultural', desc: 'Punnathur Kotta, housing over 50 elephants belonging to the temple.', distance: '3.5 km', type: 'CULTURAL' },
  { id: 'p4', name: 'Institute of Mural Painting', category: 'Cultural', desc: 'Dedicated to preserving traditional Kerala mural art.', distance: '1.5 km', type: 'CULTURAL' },
  { id: 'p5', name: 'East Nada Shopping Street', category: 'Shopping', desc: 'Traditional Kerala kasavu mundu, souvenirs, and brass lamps.', distance: '100 m', type: 'SHOPPING' }
];

export default function ExplorePage() {
  return (
    <div className="flex min-h-screen flex-col">
            <main className="flex-1 bg-temple-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold text-temple-800">Explore Guruvayoor</h1>
            <p className="mt-2 text-temple-600">Discover temples, culture, shopping and food around the holy town.</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {['All', 'Temple', 'Cultural', 'Shopping', 'Food'].map(c => (
              <button key={c} className="px-4 py-2 rounded-full border border-temple-200 bg-white text-sm font-semibold text-temple-700 hover:bg-gold-50">
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PLACES.map(place => (
              <div key={place.id} className="card bg-white overflow-hidden border border-temple-100 hover:shadow-lg transition">
                <div className="h-48 bg-temple-200 flex items-center justify-center text-4xl">
                  {place.type === 'TEMPLE' ? '🛕' : place.type === 'CULTURAL' ? '🐘' : '🛍️'}
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-gold-600 uppercase tracking-wider mb-1">{place.category}</div>
                  <h3 className="font-bold text-lg text-temple-800">{place.name}</h3>
                  <p className="text-sm text-temple-600 mt-2 line-clamp-2">{place.desc}</p>
                  
                  <div className="mt-4 flex items-center gap-4 text-sm text-temple-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {place.distance}</span>
                    <button className="text-kerala-600 hover:underline">Get Directions</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
          </div>
  );
}
