"use client"
import { CalendarIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { doctorsTable } from "@/db/schema"
import { formatCurrencyInCents } from "@/helpers/currency"

import { getAvailability } from "../_helpers/availability"
import UpsertDoctorForm from "./upsert-doctor-form"

interface DoctorCardProps{
  doctor: typeof doctorsTable.$inferSelect
}


const DoctorCard = ({ doctor } : DoctorCardProps) => {
  const doctorInicitals = doctor.name.split("").map((name) => name[0]).join("")
  
const availablity = getAvailability(doctor);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{doctorInicitals}</AvatarFallback>
          </Avatar>
          <div >
            <h3 className="text-sm font-medium">{doctor.name}</h3>
            <p className="text-sm text-muted-foreground">
              {doctor.specialty}
            </p>
          </div>
        </div>
      </CardHeader>

      <Separator/>

      <CardContent className="flex flex-col gap-2" >
        <Badge variant="outline" >
          <CalendarIcon className="mr-1" />
        {availablity.from.format("ddddd")} a {availablity.to.format("ddddd")}
        </Badge>
        <Badge variant="outline" >
          <CalendarIcon className="mr-1" />
          {availablity.from.format("HH:mm")} as {""} {availablity.to.format("HH:mm")}
        </Badge>
        <Badge variant="outline" >
          <CalendarIcon className="mr-1" />
          {formatCurrencyInCents(doctor.appointmentPriceInCents)}
        </Badge>
      </CardContent>
      <Separator/>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" >Ver detalhes</Button>
          </DialogTrigger>
          <UpsertDoctorForm/>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

export default DoctorCard