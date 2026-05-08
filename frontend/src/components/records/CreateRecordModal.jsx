import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save } from 'lucide-react';
import { createRecord } from '../../api/medicalRecords';
import { Modal, Button, Input, Textarea } from '../common';

export default function CreateRecordModal({ isOpen, onClose, appointment }) {
  const queryClient = useQueryClient();
  
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      diagnosis: '',
      notes: '',
      prescription: [{ medicine: '', dosage: '', duration: '' }],
      labTests: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "prescription"
  });

  const mutation = useMutation({
    mutationFn: (data) => createRecord({ ...data, appointmentId: appointment._id }),
    onSuccess: () => {
      toast.success('Medical record created');
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['medicalRecords']);
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create record');
    }
  });

  const onSubmit = (data) => {
    // Process labTests string to array
    const labTestsArray = data.labTests 
      ? data.labTests.split(',').map(t => t.trim()).filter(Boolean) 
      : [];
    
    // Filter empty prescriptions
    const validPrescriptions = data.prescription.filter(p => p.medicine.trim() !== '');

    mutation.mutate({
      ...data,
      labTests: labTestsArray,
      prescription: validPrescriptions
    });
  };

  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Medical Record" size="lg">
      <div className="mb-4 bg-[var(--bg-secondary)] p-4 rounded-xl text-sm">
        <p><span className="font-bold text-[var(--text-primary)]">Patient:</span> {appointment.patient?.user?.name || appointment.patient?.name}</p>
        <p><span className="font-bold text-[var(--text-primary)]">Date:</span> {new Date(appointment.date).toLocaleDateString()} at {appointment.timeSlot}</p>
        <p><span className="font-bold text-[var(--text-primary)]">Reason:</span> {appointment.reason || 'N/A'}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 block">Primary Diagnosis *</label>
          <Input 
            {...register('diagnosis', { required: 'Diagnosis is required' })} 
            placeholder="e.g. Acute Bronchitis"
            error={errors.diagnosis?.message}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-[var(--text-primary)] block">Prescriptions</label>
            <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => append({ medicine: '', dosage: '', duration: '' })}>
              Add Med
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-start bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border)]">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input {...register(`prescription.${index}.medicine`)} placeholder="Medicine name" size="sm" />
                  <Input {...register(`prescription.${index}.dosage`)} placeholder="e.g. 500mg twice daily" size="sm" />
                  <Input {...register(`prescription.${index}.duration`)} placeholder="e.g. 5 days" size="sm" />
                </div>
                <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors mt-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {fields.length === 0 && <p className="text-sm text-[var(--text-muted)] italic">No prescriptions added.</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 block">Lab Tests (comma separated)</label>
          <Input 
            {...register('labTests')} 
            placeholder="e.g. Complete Blood Count, Chest X-Ray"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 block">Clinical Notes</label>
          <Textarea 
            {...register('notes')} 
            placeholder="Detailed observation notes..."
            rows={4}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon={Save} isLoading={mutation.isPending}>
            Save Record
          </Button>
        </div>
      </form>
    </Modal>
  );
}
