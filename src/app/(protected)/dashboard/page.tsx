import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getDashboard } from "@/data/get-dashboard";
import { auth } from "@/lib/auth";

import { appointmentsTableColumns } from "../appointments/_components/table-columns";
import AppointmentsChart from "./components/appointments-chart";
import { DatePicker } from "./components/date-picker";
import StatsCards from "./components/stats-cards";
import TopDoctors from "./components/top-doctors";
import TopSpecialties from "./components/top-especialty";

interface DashboardPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session?.user.clinic) {
    redirect("/clinic-form");
  }

  if (!session?.user.clinic.id) {
    redirect("/clinic-form");
  }
  if (!session.user.plan) {
    redirect("/new-subscription");
  }

  const { from, to } = await searchParams;

  if (!from || !to) {
    redirect(
      `dashboard?from=${dayjs().format("YYYY-MM-DD")}&to=${dayjs().add(1, "month").format("YYYY-MM-DD")}`,
    );
  }

  const {
    totalRevenue,
    totalAppointments,
    totalPatients,
    totalDoctors,
    topDoctors,
    topSpecialties,
    todayAppointments,
    dailyAppointmentsData,
  } = await getDashboard({
    from,
    to,
    session: {
      user: {
        clinic: {
          id: session.user.clinic.id,
        },
      },
    },
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>Resumo das informacoes</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <DatePicker />
        </PageActions>
      </PageHeader>
      <PageContent>
        <StatsCards
          totalRevenue={totalRevenue.total ? Number(totalRevenue.total) : null}
          totalAppointments={totalAppointments.total}
          totalPatients={totalPatients.total}
          totalDoctors={totalDoctors.total}
        />
        <div className="flex w-full flex-wrap gap-4 lg:grid lg:flex-none lg:grid-cols-[2.25fr_1fr]">
          <AppointmentsChart
            className="w-full"
            dailyAppointmentsData={dailyAppointmentsData}
          />
          <TopDoctors className="w-full" doctors={topDoctors} />
        </div>
        <div className="flex w-full flex-wrap gap-4 lg:grid lg:flex-none lg:grid-cols-[2.25fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <CalendarIcon className="text-muted-foreground" />
                <CardTitle className="text-base">Agendamento de hoje</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 lg:p-6">
              <DataTable
                columns={appointmentsTableColumns}
                data={todayAppointments}
              />
            </CardContent>
          </Card>
          <TopSpecialties className="w-full" topSpecialties={topSpecialties} />
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default DashboardPage;
