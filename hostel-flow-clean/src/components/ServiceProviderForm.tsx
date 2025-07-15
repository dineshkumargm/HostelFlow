
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/services/api';

interface ServiceProviderFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ServiceProviderForm = ({ isOpen, onClose }: ServiceProviderFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    services: [] as number[]
  });
  const [serviceInput, setServiceInput] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProviderMutation = useMutation({
    mutationFn: adminAPI.createServiceProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-providers'] });
      toast({
        title: 'Success',
        description: 'Service provider created successfully.',
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create service provider.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      services: []
    });
    setServiceInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.services.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one service.',
        variant: 'destructive',
      });
      return;
    }
    createProviderMutation.mutate(formData);
  };

  const addService = () => {
    const trimmed = serviceInput.trim();
    const serviceId = parseInt(trimmed, 10);
  
    if (!isNaN(serviceId) && !formData.services.includes(serviceId)) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, serviceId]
      }));
      setServiceInput('');
    }
  };
  

  const removeService = (serviceToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service !== serviceToRemove)
    }));
  };
  

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addService();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Service Provider</DialogTitle>
          <DialogDescription>
            Create a new service provider profile
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={formData.specialization}
              onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
              placeholder="e.g., Electrical, Plumbing, Cleaning"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="services">Services</Label>
            <div className="flex space-x-2">
              <Input
                id="services"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a service and press Enter"
              />
              <Button type="button" onClick={addService} variant="outline">
                Add
              </Button>
            </div>
            
            {formData.services.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.services.map((service, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {service}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeService(service)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProviderMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {createProviderMutation.isPending ? 'Creating...' : 'Create Provider'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceProviderForm;
