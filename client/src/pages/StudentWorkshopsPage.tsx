import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';


interface Workshop {
  id: string;
  title: string;
  room: string;
  startTime: string;
  capacity: number;
  availableSeats: number;
  price: number;
  category: string;
}

const StudentWorkshopsPage = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [workshopsRes, registrationsRes] = await Promise.all([
        fetch('http://localhost:3000/workshops'),
        fetch('http://localhost:3000/registrations/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (workshopsRes.ok) {
        const data = await workshopsRes.json();
        setWorkshops(data.items);
      }

      if (registrationsRes.ok) {
        const regs = await registrationsRes.json();
        // Filter out cancelled registrations
        const activeRegs = regs
          .filter((r: any) => r.status !== 'CANCELLED')
          .map((r: any) => r.workshopId);
        setMyRegistrations(activeRegs);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      showNotification('Could not load workshop data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/registrations/${id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        showNotification('Registered successfully!', 'success');
        fetchData();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration failed', error);
      showNotification('Connection error during registration', 'error');
    }
  };


  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight sm:text-5xl">
          Available <span className="text-indigo-600">Workshops</span>
        </h1>
        <p className="text-gray-500 mt-4 text-lg">
          Browse and register for upcoming university workshops. Limited seats available!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-100 rounded w-3/4 mb-6"></div>
              <div className="h-4 bg-gray-50 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-50 rounded w-1/3 mb-10"></div>
              <div className="h-12 bg-indigo-50 rounded-2xl w-full"></div>
            </div>
          ))
        ) : workshops.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold text-xl">
            No workshops available right now. Check back later!
          </div>
        ) : (
          workshops.map((workshop) => {
            const isRegistered = myRegistrations.includes(workshop.id);
            return (
              <div key={workshop.id} className="group bg-white rounded-3xl p-8 shadow-xl border border-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {workshop.category}
                  </span>
                  <span className={`font-black ${workshop.price === 0 ? 'text-emerald-500' : 'text-gray-900'}`}>
                    {workshop.price === 0 ? 'FREE' : `${workshop.price.toLocaleString()}đ`}
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                  {workshop.title}
                </h3>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-sm text-gray-500 font-semibold">
                    <svg className="w-4 h-4 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.828a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {workshop.room}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 font-semibold">
                    <svg className="w-4 h-4 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(workshop.startTime).toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 font-semibold">
                    <svg className="w-4 h-4 mr-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {workshop.availableSeats} / {workshop.capacity} seats left
                  </div>
                </div>

                <button
                  onClick={() => !isRegistered && handleRegister(workshop.id)}
                  disabled={workshop.availableSeats === 0 || isRegistered}
                  className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg
                    ${isRegistered 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-none cursor-default'
                      : workshop.availableSeats === 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'}`}
                >
                  {isRegistered 
                    ? '✓ Registered' 
                    : workshop.availableSeats === 0 ? 'Fully Booked' : 'Register Now'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


export default StudentWorkshopsPage;
