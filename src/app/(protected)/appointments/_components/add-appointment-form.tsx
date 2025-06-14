"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import z from "zod";

import { addAppointment } from "@/actions/add-appointment";
// import { getAvailableTimes } from "@/actions/get-available-times";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doctorsTable, patientsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  patientId: z.string().min(1, {
    message: "Paciente é obrigatório",
  }),
  doctorId: z.string().min(1, {
    message: "Médico é obrigatório",
  }),
  date: z.date({
    message: "Data é obrigatória",
  }),
  time: z.string().min(1, {
    message: "Horário é obrigatório",
  }),
  appointmentPrice: z.number().min(1, {
    message: "Valor da consulta é obrigatório",
  }),
});

interface AddAppointmentFormProps {
  isOpen: boolean;
  onSuccess?: () => void;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

const AddAppointmentForm = ({
  isOpen,
  onSuccess,
  patients,
  doctors,
}: AddAppointmentFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      date: undefined,
      time: "",
      appointmentPrice: 0,
    },
  });

  const selectedDate = form.watch("date");
  const selectedDoctorId = form.watch("doctorId");
  const selectedPatientId = form.watch("patientId");

  // Atualizar preço quando médico for selecionado
  useEffect(() => {
    if (selectedDoctorId) {
      const selectedDoctor = doctors.find(
        (doctor) => doctor.id === selectedDoctorId,
      );
      if (selectedDoctor) {
        form.setValue(
          "appointmentPrice",
          selectedDoctor.appointmentPriceInCents / 100,
        );
      }
    }
  }, [selectedDoctorId, doctors, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        patientId: "",
        doctorId: "",
        appointmentPrice: 0,
        date: undefined,
        time: "",
      });
    }
  }, [isOpen, form]);

  const addAppointmentAction = useAction(addAppointment, {
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso.");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao criar agendamento.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addAppointmentAction.execute({
      ...values,
      appointmentPriceInCents: values.appointmentPrice * 100,
    });
  };

  const isDateAvailable = (date: Date) => {
    if (!selectedDoctorId) return false;
    const selectedDoctor = doctors.find(
      (doctor) => doctor.id === selectedDoctorId,
    );
    if (!selectedDoctor) return false;
    const dayOfWeek = date.getDay();
    return (
      dayOfWeek >= selectedDoctor?.availableFromWeekDay &&
      dayOfWeek <= selectedDoctor?.availableToWeekDay
    );
  };

  const isDateTimeEnabled = selectedPatientId && selectedDoctorId;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Novo Agendamento</DialogTitle>
        <DialogDescription>
          Preencha os dados para criar um novo agendamento.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Médico</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um médico" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da Consulta</FormLabel>
                <FormControl>
                  <NumericFormat
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value.floatValue);
                    }}
                    decimalScale={2}
                    fixedDecimalScale
                    decimalSeparator=","
                    thousandSeparator="."
                    prefix="R$ "
                    allowNegative={false}
                    disabled={!selectedDoctorId}
                    customInput={Input}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        disabled={!isDateTimeEnabled}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || !isDateAvailable(date)
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!isDateTimeEnabled || !selectedDate}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="08:00">08:00</SelectItem>
                    <SelectItem value="08:30">08:30</SelectItem>
                    <SelectItem value="09:00">09:00</SelectItem>
                    <SelectItem value="09:30">09:30</SelectItem>
                    <SelectItem value="10:00">10:00</SelectItem>
                    <SelectItem value="10:30">10:30</SelectItem>
                    <SelectItem value="11:00">11:00</SelectItem>
                    <SelectItem value="11:30">11:30</SelectItem>
                    <SelectItem value="14:00">14:00</SelectItem>
                    <SelectItem value="14:30">14:30</SelectItem>
                    <SelectItem value="15:00">15:00</SelectItem>
                    <SelectItem value="15:30">15:30</SelectItem>
                    <SelectItem value="16:00">16:00</SelectItem>
                    <SelectItem value="16:30">16:30</SelectItem>
                    <SelectItem value="17:00">17:00</SelectItem>
                    <SelectItem value="17:30">17:30</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={addAppointmentAction.isPending}>
              {addAppointmentAction.isPending
                ? "Criando..."
                : "Criar agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default AddAppointmentForm;
