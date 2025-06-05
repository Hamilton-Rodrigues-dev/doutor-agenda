import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

///1 - Criar tabelas de cada entidade, 2 - Criar ENUM 3 - Criar Relations 4 - Criar uma realção many-to-many, usa-se uma tabela intermediária

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
});

export const userTableRelations = relations(usersTable, ({ many }) => ({
  usertoClinics: many(userToClinicsTable),
}));

///Tabela intermediária para n-n
export const userToClinicsTable = pgTable("user_to_clinics", {
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateat: timestamp("updateAt")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateat: timestamp("updateAt")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const clinicTableRelations = relations(clinicsTable, ({ many }) => ({
  doctors: many(doctorsTable),
  pacients: many(patientsTable),
  appointments: many(appointmentsTable),
  userToClinics: many(userToClinicsTable),
}));

export const userToClinicsTableRelations = relations(
  userToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [userToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [userToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  avatarImageUrl: text("avatar_image_url"),
  specialty: text("specialty").notNull(),
  ///One - Monday, Two - Tuesday, Three - Wednesday, Four - Thursday, Five - Friday, Six - Saturday, zero - Sunday
  availableFromWeekDay: integer("available_from_week_day").notNull(), ///1
  availableToWeekDay: integer("available_to_week_day").notNull(), ///5
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(), //Salvar em centavos e dividir por 100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateat: timestamp("updateAt")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const doctorTableRelations = relations(doctorsTable, ({ one }) => ({
  clinic: one(clinicsTable, {
    fields: [doctorsTable.clinicId],
    references: [clinicsTable.id],
  }),
}));

export const pacientsSexEnum = pgEnum("sex", ["male", "female"]);

export const patientsTable = pgTable("pacients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  sex: pacientsSexEnum("sex").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateat: timestamp("updateAt")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const patientTableRelations = relations(patientsTable, ({ one }) => ({
  clinic: one(clinicsTable, {
    fields: [patientsTable.clinicId],
    references: [clinicsTable.id],
  }),
}));

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  time: timestamp("date").notNull(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  patientId: uuid("pacient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateat: timestamp("updateAt")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const appointmentTableRelations = relations(
  appointmentsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [appointmentsTable.clinicId],
      references: [clinicsTable.id],
    }),
    patient: one(patientsTable, {
      fields: [appointmentsTable.patientId],
      references: [patientsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [appointmentsTable.doctorId],
      references: [doctorsTable.id],
    }),
  }),
);
