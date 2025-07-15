import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useRescheduleBooking } from '@/hooks/useBookings';
import { servicesAPI } from '@/services/api';
import { format } from 'date-fns';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

const RescheduleModal = ({ isOpen, onClose, booking }: RescheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const rescheduleBooking = useRescheduleBooking();

  const timeSlots = [
    '08:00-10:00', '10:00-12:00', '12:00-14:00',
    '14:00-16:00', '15:00-16:00', '16:00-18:00',
  ];

  useEffect(() => {
    const fetchUnavailable = async () => {
      if (!selectedDate || !booking) return;
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      try {
        const data = await servicesAPI.getUnavailableSlots(booking.service.id, formattedDate);
        setUnavailableSlots(data.unavailable_slots || []);
      } catch (error) {
        console.error('Failed to fetch unavailable slots', error);
      }
    };
    fetchUnavailable();
  }, [selectedDate, booking]);

  const handleReschedule = () => {
    if (!selectedDate || !selectedTimeSlot) return;
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    console.log(selectedDate , formattedDate);
    rescheduleBooking.mutate({
      bookingId: booking.id,
      newDateTime: { date: formattedDate, time_slot: selectedTimeSlot }
    }, {
      onSuccess: () => {
        onClose();
        setSelectedDate(undefined);
        setSelectedTimeSlot('');
      }
    });
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>
            Select a new date and time for your {booking?.service.name} booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Select Date
            </h4>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className="rounded-md border"
            />
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Time
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTimeSlot === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeSlot(slot)}
                    disabled={unavailableSlots.includes(slot)}
                    className={`text-sm ${
                      unavailableSlots.includes(slot)
                        ? 'border-red-300 bg-red-50 text-red-400 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTimeSlot || rescheduleBooking.isPending}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {rescheduleBooking.isPending ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleModal;
