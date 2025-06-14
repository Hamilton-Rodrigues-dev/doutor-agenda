"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { doctorsTable, patientsTable } from "@/db/schema";

import UpsertAppointmentForm from "./upsert-appointment-form";

interface AddAppointmentButtonProps {
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
}

const AddAppointmentButton = ({
  patients,
  doctors,
}: AddAppointmentButtonProps) => {
  const [isOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Adicionar agendamento
        </Button>
      </DialogTrigger>
      <UpsertAppointmentForm
        onSuccess={() => setIsDialogOpen(false)}
        isOpen={isOpen}
        patients={patients}
        doctors={doctors}
      />
    </Dialog>
  );
};

export default AddAppointmentButton;
