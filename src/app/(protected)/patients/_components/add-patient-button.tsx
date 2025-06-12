"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import UpsertPatientForm from "./upsert-patient-form";

const AddPatientButton = () => {
  const [isOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Adicionar paciente
        </Button>
      </DialogTrigger>
      <UpsertPatientForm
        onSuccess={() => setIsDialogOpen(false)}
        isOpen={isOpen}
      />
    </Dialog>
  );
};

export default AddPatientButton;
