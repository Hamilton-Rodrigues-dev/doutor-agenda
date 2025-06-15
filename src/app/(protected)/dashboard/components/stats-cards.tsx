import {
  CalendarIcon,
  DollarSignIcon,
  Stethoscope,
  UserIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";

interface StatsCardsProps {
  totalRevenue: string | null;
  totalAppointments: number;
  totalPatients: number;
  totalDoctors: number;
}

const StatsCards = ({
  totalRevenue,
  totalAppointments,
  totalPatients,
  totalDoctors,
}: StatsCardsProps) => {
  const stats = [
    {
      title: "Faturamento",
      value: totalRevenue
        ? formatCurrencyInCents(Number(totalRevenue))
        : "R$ 0,00",
      icon: DollarSignIcon,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Agendamentos",
      value: totalAppointments.toString(),
      icon: CalendarIcon,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pacientes",
      value: totalPatients.toString(),
      icon: UserIcon,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Médicos",
      value: totalDoctors.toString(),
      icon: Stethoscope,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title} className="gap-2">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
