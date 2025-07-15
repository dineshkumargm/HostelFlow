import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,} from '@/components/ui/dialog';  
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { serviceProviderAPI, notificationsAPI } from '@/services/api';
import { Bell, Calendar, CheckCircle, Clock, User, Wrench } from 'lucide-react';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Booking {
  id: string;
  service: {
    name:string;
  };
  provider_name: string;
  room_number: string;
  date: string;
  time_slot: string;
  status: string;
  special_instructions?: string;
  created_at: string;
}

interface Notification {
  id: string;
  message: string;
  booking_id: string;
  read: boolean;
  created_at: string;
}

const ServiceProviderDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [stats, setStats] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
    total_today: 0,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bookingsData, notificationsData] = await Promise.all([
        serviceProviderAPI.getAssignedBookings(),
        serviceProviderAPI.getNotifications(),
      ]);
      setBookings(bookingsData);
      setNotifications(notificationsData);
      
      // Calculate stats from bookings
      const today = new Date().toDateString();
      const todayBookings = bookingsData.filter((b: Booking) => 
        new Date(b.date).toDateString() === today
      );
      
      setStats({
        pending: bookingsData.filter((b: Booking) => b.status === 'Booked').length,
        in_progress: bookingsData.filter((b: Booking) => b.status === 'Booked').length,
        completed: bookingsData.filter((b: Booking) => b.status === 'Completed').length,
        total_today: todayBookings.length,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'in_progress' | 'completed') => {
    try {
      await serviceProviderAPI.updateBookingStatus(bookingId, status);
      
      if (status === 'completed') {
        // Send completion notification to user
        await serviceProviderAPI.sendCompletionNotification(
          bookingId, 
          'Your service has been completed successfully!'
        );
      }
      
      toast({
        title: 'Success',
        description: `Booking status updated to ${status.replace('_', ' ')}`,
      });
      
      loadData(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update booking status.',
        variant: 'destructive',
      });
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await serviceProviderAPI.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header hideNotifications />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Service Provider Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.name}! Manage your assigned bookings and track your progress.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.in_progress}</p>
                  </div>
                  <Wrench className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Total</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.total_today}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="notifications" className="relative">
                Notifications
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Assigned Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.service.name}
                          </TableCell>
                          <TableCell>{booking.provider_name}</TableCell>
                          <TableCell>{booking.room_number}</TableCell>
                          <TableCell>{formatDate(booking.date)}</TableCell>
                          <TableCell>{booking.time_slot}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {booking.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                  Start
                                </Button>
                              )}
                              {booking.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking.id, 'completed')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No notifications</p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.read 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-blue-50 border-blue-200'
                          }`}
                          onClick={() => {
                            setSelectedNotification(notification);
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open && selectedNotification && !selectedNotification.read) {
                // Mark as read once closed
                markNotificationRead(selectedNotification.id);
            }
            }}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                <p className="text-gray-800">{selectedNotification?.message}</p>
                <p className="text-xs text-gray-500">
                    {selectedNotification && new Date(selectedNotification.created_at).toLocaleString()}
                </p>
                </div>
            </DialogContent>
            </Dialog>

        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ServiceProviderDashboard;