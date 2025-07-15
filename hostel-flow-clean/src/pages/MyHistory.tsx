import { useEffect } from 'react';
import { useMyBookings } from '@/hooks/useBookings';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';  // ✅ Import Button!
import { Calendar, Clock, MapPin } from 'lucide-react';

const MyHistory = () => {
  const { data: bookings, isLoading, refetch } = useMyBookings();

  useEffect(() => {
    refetch(); // fetch on load
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // ✅ Ask if completed button click handler
  const askIfCompleted = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('auth_token'); 
      const res = await fetch(`http://localhost:8000/api/bookings/${bookingId}/ask-if-completed/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
  
      if (!res.ok) {
        // safely read text instead of json
        const text = await res.text();
        console.error('Error response:', text);
        alert('Failed to send notification: ' + text);
        return;
      }
  
      const data = await res.json();
      alert(data.message || 'Notification sent!');
    } catch (err) {
      console.error(err);
      alert('Failed to send notification.');
    }
  };
  

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mt-6 mx-4">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">Booking History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : bookings?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No history found</p>
        ) : (
          bookings.map((booking: any) => (
            <div key={booking.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">{booking.service ? booking.service.name : 'Unknown Service'}</h4>
                <Badge className={getStatusColor(booking.status)}>{booking.status.replace('_', ' ')}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(booking.date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{booking.time_slot}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.room_number}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{booking.provider_name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => askIfCompleted(booking.id)}
                >
                  Ask if completed
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default MyHistory;
