import { NextRequest, NextResponse } from "next/server";
import { canBook, getAvailableTimes, type Appointment } from "@/lib/booking";
import { getService } from "@/lib/config";
import {
  readAppointments,
  withAppointmentLock,
  writeAppointments,
} from "@/lib/storage";

export const runtime = "nodejs";

type CreateAppointmentBody = {
  serviceId?: string;
  date?: string;
  time?: string;
  clientName?: string;
  whatsapp?: string;
};

function cleanWhatsapp(value: string) {
  return value.replace(/\D/g, "");
}

function validateBody(body: CreateAppointmentBody) {
  const service = body.serviceId ? getService(body.serviceId) : undefined;

  if (!service) return { error: "Selecione um serviço válido." };
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return { error: "Escolha uma data válida." };
  }
  if (!body.time || !/^\d{2}:\d{2}$/.test(body.time)) {
    return { error: "Escolha um horário válido." };
  }
  if (!body.clientName || body.clientName.trim().length < 3) {
    return { error: "Informe seu nome completo." };
  }

  const whatsapp = body.whatsapp ? cleanWhatsapp(body.whatsapp) : "";
  if (whatsapp.length < 10 || whatsapp.length > 11) {
    return { error: "Informe um WhatsApp válido." };
  }

  return { service, whatsapp };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = getService(searchParams.get("serviceId") ?? "");
  const date = searchParams.get("date");

  if (!service || !date) {
    return NextResponse.json(
      { error: "Serviço e data são obrigatórios." },
      { status: 400 },
    );
  }

  const appointments = await readAppointments();
  return NextResponse.json(getAvailableTimes(service, date, appointments));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateAppointmentBody;
  const validation = validateBody(body);

  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const appointment = await withAppointmentLock(async () => {
    const appointments = await readAppointments();
    const isAvailable = canBook(
      validation.service,
      body.date!,
      body.time!,
      appointments,
    );

    if (!isAvailable) return null;

    const nextAppointment: Appointment = {
      id: crypto.randomUUID(),
      serviceId: validation.service.id,
      date: body.date!,
      time: body.time!,
      clientName: body.clientName!.trim(),
      whatsapp: validation.whatsapp,
      createdAt: new Date().toISOString(),
    };

    await writeAppointments([...appointments, nextAppointment]);
    return nextAppointment;
  });

  if (!appointment) {
    return NextResponse.json(
      {
        error:
          "Este horário acabou de ser reservado. Escolha outro horário disponível.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ appointment }, { status: 201 });
}
