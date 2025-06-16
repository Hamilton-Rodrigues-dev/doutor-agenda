"use client";
import { CalendarIcon, ClockIcon, DollarSignIcon } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { doctorsTable } from "@/db/schema";
import { formatCurrencyInCents } from "@/helpers/currency";

import { getAvailability } from "../_helpers/availability";
import UpsertDoctorForm from "./upsert-doctor-form";

interface DoctorCardProps {
  doctor: typeof doctorsTable.$inferSelect;
  className?: string;
}

const DoctorCard = ({ doctor, className }: DoctorCardProps) => {
  const [isUpsertDialogOpen, setIsUpsertDialogOpen] = useState(false);
  const doctorInicitals = doctor.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const availablity = getAvailability(doctor);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{doctorInicitals}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{doctor.name}</h3>
            <p className="text-muted-foreground text-sm">{doctor.specialty}</p>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col gap-2">
        {" "}
        <Badge variant="outline">
          <CalendarIcon className="mr-1" />
          {availablity.from.format("dddd")} a {availablity.to.format("dddd")}
        </Badge>
        <Badge variant="outline">
          <ClockIcon className="mr-1" />
          {availablity.from.format("HH:mm")} as {""}{" "}
          {availablity.to.format("HH:mm")}
        </Badge>
        <Badge variant="outline">
          <DollarSignIcon className="mr-1" />
          {formatCurrencyInCents(doctor.appointmentPriceInCents)}
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter>
        <Dialog open={isUpsertDialogOpen} onOpenChange={setIsUpsertDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Ver detalhes</Button>
          </DialogTrigger>
          <UpsertDoctorForm
            doctor={{
              ...doctor,
              availableFromTime: availablity.from.format("HH:mm:ss"),
              availableToTime: availablity.to.format("HH:mm:ss"),
            }}
            onSuccess={() => setIsUpsertDialogOpen(false)}
            isOpen={isUpsertDialogOpen}
          />
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default DoctorCard;
