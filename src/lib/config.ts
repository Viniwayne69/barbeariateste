export type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  durationLabel: string;
  priceCents: number;
  image: string;
};

export const timezone = "America/Sao_Paulo";

export const services: Service[] = [
  {
    id: "corte",
    name: "Corte",
    description: "Corte personalizado com acabamento profissional.",
    durationMinutes: 45,
    durationLabel: "45 min",
    priceCents: 7000,
    image:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "barba",
    name: "Barba",
    description: "Modelagem e alinhamento da barba com toalha quente.",
    durationMinutes: 30,
    durationLabel: "30 min",
    priceCents: 5000,
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "corte-barba",
    name: "Corte + Barba",
    description: "Serviço completo para um visual impecável.",
    durationMinutes: 75,
    durationLabel: "1h 15 min",
    priceCents: 10000,
    image:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&q=85",
  },
];

export const bookingConfig = {
  timezone,
  openWeekDays: [1, 2, 3, 4, 5, 6],
  startTime: "09:00",
  endTime: "18:00",
  offeredTimes: ["09:00", "10:00", "11:30", "14:00", "15:30", "17:00"],
};

export const heroImage =
  "https://images.unsplash.com/photo-1781455793310-8427c96454c7?auto=format&fit=crop&w=1400&q=88";

export function getService(serviceId: string) {
  return services.find((service) => service.id === serviceId);
}

export function formatCurrency(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}
