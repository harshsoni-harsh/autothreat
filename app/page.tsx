'use client';

import { useUser } from '@auth0/nextjs-auth0';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Users, BarChart3, CheckCircle } from "lucide-react";

export default function Home() {
  const { user } = useUser();

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif' }}>
//       <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
//         <div style={{ display: 'flex', alignItems: 'center' }}>
//           <Image src="/logo.png" alt="Logo" height={40} width={40} style={{ marginRight: '0.5rem' }} />
//           <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Autothreat</h1>
//         </div>
//         <div>
//           {user ? (
//             <Link prefetch={false} href="/dashboard">
//               <button style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>Dashboard</button>
//             </Link>
//           ) : (
//             <Link prefetch={false} href="/auth/login">
//               <button style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>Login</button>
//             </Link>
//           )}
//         </div>
//       </header>
//       <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <h2>Welcome to the Autothreat Platform</h2>
//       </main>
//     </div>
//   );
// }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              {/* <div className="flex items-center justify-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Target className="text-white text-xl" />
                </div>
                
              </div> */}
              <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-4 backdrop-blur-md bg-white/10 ">
      
      <div className="flex items-center space-x-3">
        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            height={36} 
            width={36} 
            className="rounded-full"
          />
        </div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-lg tracking-tight select-none">
          Autothreat
        </h1>
      </div>
      </nav>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                Welcome to
                <span className="text-primary block">Autothreat Platform</span>
              </h2>
       <nav className="fixed top-0 right-0 w-full z-50 flex items-center justify-between px-8 py-4 ">
        <div></div>
        {/* Right side - Button */}
          <div className="flex items-center space-x-4">
            {user ? (
              <Link prefetch={false} href="/dashboard">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-2xl backdrop-blur-md border border-white/20"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link prefetch={false} href="/auth/login">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 font-semibold text-white bg-gradient-to-r from-indigo-400 to-indigo-500 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-2xl backdrop-blur-md border border-white/20"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
