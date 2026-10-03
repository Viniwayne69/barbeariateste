"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Gem,
  LockKeyhole,
  Menu,
  PenLine,
  Scissors,
  ShieldCheck,
  Sparkles,
  User,
  Phone,
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { formatCurrency, heroImage, services } from "@/lib/config";

type Step = 1 | 2 | 3 | 4;

type Availability = {
  date: string;
  serviceId: string;
  availableTimes: string[];
};

const weekLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

function maskWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getInitialDate() {
  const now = parseDateKey(todayKey());
  for (let offset = 0; offset < 10; offset += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    if (date.getDay() !== 0) return dateToKey(date);
  }
  return todayKey();
}

export default function Home() {
  const initialDate = useMemo(() => getInitialDate(), []);
  const [step, setStep] = useState<Step>(1);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0].id);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => {
    const date = parseDateKey(initialDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [clientName, setClientName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  const selectedService =
    services.find((service) => service.id === selectedServiceId) ?? services[0];

  useEffect(() => {
    const stored = window.localStorage.getItem("noir-booking-draft");
    if (stored) {
      try {
        const draft = JSON.parse(stored) as {
          step?: Step;
          serviceId?: string;
          date?: string;
          time?: string;
          name?: string;
          whatsapp?: string;
        };
        if (draft.step && draft.step >= 1 && draft.step <= 4) setStep(draft.step);
        if (draft.serviceId && services.some((item) => item.id === draft.serviceId)) {
          setSelectedServiceId(draft.serviceId);
        }
        if (draft.date) {
          setSelectedDate(draft.date);
          const date = parseDateKey(draft.date);
          setMonthCursor(new Date(date.getFullYear(), date.getMonth(), 1));
        }
        if (draft.time) setSelectedTime(draft.time);
        if (draft.name) setClientName(draft.name);
        if (draft.whatsapp) setWhatsapp(draft.whatsapp);
      } catch {
        window.localStorage.removeItem("noir-booking-draft");
      }
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || success) return;
    window.localStorage.setItem(
      "noir-booking-draft",
      JSON.stringify({
        step,
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
        name: clientName,
        whatsapp,
      }),
    );
  }, [
    clientName,
    draftReady,
    selectedDate,
    selectedServiceId,
    selectedTime,
    step,
    success,
    whatsapp,
  ]);

  useEffect(() => {
    if (step < 3 || !selectedDate || !selectedServiceId) return;
    const controller = new AbortController();
    setLoadingTimes(true);
    setError("");

    fetch(
      `/api/appointments?serviceId=${selectedServiceId}&date=${selectedDate}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar os horários.");
        return data as Availability;
      })
      .then((data) => {
        setAvailability(data);
        if (selectedTime && !data.availableTimes.includes(selectedTime)) {
          setSelectedTime("");
        }
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message);
          setAvailability(null);
        }
      })
      .finally(() => setLoadingTimes(false));

    return () => controller.abort();
  }, [selectedDate, selectedServiceId, selectedTime, step]);

  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: first.getDay() }, (_, index) => ({
      key: `blank-${index}`,
      label: "",
      dateKey: "",
    }));
    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1);
      return {
        key: dateToKey(date),
        label: String(index + 1),
        dateKey: dateToKey(date),
      };
    });
    return [...blanks, ...days];
  }, [monthCursor]);

  function goToStep(nextStep: Step) {
    setError("");
    setStep(nextStep);
  }

  function goBack() {
    if (success) {
      setSuccess(false);
      setStep(1);
      return;
    }
    if (step > 1) goToStep((step - 1) as Step);
  }

  function handleDateSelect(dateKey: string) {
    const date = parseDateKey(dateKey);
    if (dateKey < todayKey() || date.getDay() === 0) return;
    setSelectedDate(dateKey);
    setSelectedTime("");
  }

  function handleServiceSelect(serviceId: string) {
    setSelectedServiceId(serviceId);
    setSelectedTime("");
  }

  async function confirmAppointment() {
    setError("");

    if (clientName.trim().length < 3) {
      setError("Informe seu nome para confirmar o agendamento.");
      return;
    }

    const whatsappDigits = whatsapp.replace(/\D/g, "");
    if (whatsappDigits.length < 10) {
      setError("Informe um número de WhatsApp válido.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          date: selectedDate,
          time: selectedTime,
          clientName,
          whatsapp,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível confirmar.");

      setSuccess(true);
      window.localStorage.removeItem("noir-booking-draft");
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : "Não foi possível confirmar o agendamento.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canContinueFromDate = Boolean(selectedDate && selectedTime);
  const availableTimes = availability?.availableTimes ?? [];

  return (
    <main className="site-frame">
      <section className={`app-shell step-${step}`} aria-live="polite">
        {step === 1 ? (
          <HomeScreen onStart={() => goToStep(2)} />
        ) : (
          <>
            <AppHeader step={step} onBack={goBack} />
            <div className="screen-scroll">
              {step === 2 && (
                <ServiceScreen
                  selectedServiceId={selectedServiceId}
                  onSelect={handleServiceSelect}
                  onContinue={() => goToStep(3)}
                />
              )}
              {step === 3 && (
                <DateScreen
                  monthCursor={monthCursor}
                  setMonthCursor={setMonthCursor}
                  calendarDays={calendarDays}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  loadingTimes={loadingTimes}
                  availableTimes={availableTimes}
                  error={error}
                  serviceDuration={selectedService.durationLabel}
                  onDateSelect={handleDateSelect}
                  onTimeSelect={setSelectedTime}
                  onContinue={() => {
                    if (!canContinueFromDate) {
                      setError("Escolha uma data e um horário disponível.");
                      return;
                    }
                    goToStep(4);
                  }}
                />
              )}
              {step === 4 && (
                <ConfirmScreen
                  clientName={clientName}
                  whatsapp={whatsapp}
                  setClientName={setClientName}
                  setWhatsapp={(value) => setWhatsapp(maskWhatsapp(value))}
                  service={selectedService}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  error={error}
                  success={success}
                  submitting={submitting}
                  onEdit={() => goToStep(3)}
                  onConfirm={confirmAppointment}
                  onNew={() => {
                    setSuccess(false);
                    setStep(1);
                    setSelectedTime("");
                    setClientName("");
                    setWhatsapp("");
                  }}
                />
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo ${compact ? "logo-compact" : ""}`} aria-label="NOIR BARBER">
      {!compact && <span className="monogram">N</span>}
      <span className="logo-word">NOIR</span>
      <span className="logo-subtitle">BARBER</span>
    </div>
  );
}

function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="home-screen"
      style={{ "--hero-image": `url(${heroImage})` } as CSSProperties}
    >
      <header className="home-top">
        <Logo />
        <button className="icon-button ghost-button" type="button" aria-label="Abrir menu">
          <Menu size={22} />
        </button>
      </header>

      <div className="home-copy">
        <span className="home-eyebrow">Atendimento premium</span>
        <h1>Seu próximo corte começa aqui.</h1>
        <p>Agende corte, barba ou serviço completo em poucos toques, com a experiência Noir Barber.</p>
      </div>

      <button className="primary-button home-button" type="button" onClick={onStart}>
        <span>Agendar horário</span>
        <ArrowRight size={18} />
      </button>

      <div className="home-benefits" aria-label="Diferenciais">
        <span>
          <Gem size={18} />
          Profissionais especializados
        </span>
        <span>
          <Crown size={18} />
          Ambiente exclusivo
        </span>
        <span>
          <ShieldCheck size={18} />
          Atendimento pontual
        </span>
      </div>
    </div>
  );
}

function AppHeader({ step, onBack }: { step: Step; onBack: () => void }) {
  return (
    <header className="app-header">
      <button className="icon-button" type="button" onClick={onBack} aria-label="Voltar">
        <ArrowLeft size={20} />
      </button>
      <Logo compact />
      <span className="step-count">{step}/4</span>
    </header>
  );
}

function ScreenTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="screen-title">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function ServiceScreen({
  selectedServiceId,
  onSelect,
  onContinue,
}: {
  selectedServiceId: string;
  onSelect: (serviceId: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="screen-content">
      <ScreenTitle
        title="Escolha o serviço"
        description="Selecione o serviço que deseja realizar."
      />

      <div className="service-list">
        {services.map((service) => {
          const selected = service.id === selectedServiceId;
          return (
            <button
              className={`service-card ${selected ? "selected" : ""}`}
              key={service.id}
              type="button"
              onClick={() => onSelect(service.id)}
            >
              <img src={service.image} alt="" />
              <span className="service-info">
                <span className="service-name">{service.name}</span>
                <span className="service-description">{service.description}</span>
                <span className="service-meta">
                  <span>
                    <Clock3 size={15} />
                    {service.durationLabel}
                  </span>
                  <strong>{formatCurrency(service.priceCents)}</strong>
                </span>
              </span>
              <span className="radio-mark" aria-hidden="true">
                {selected && <span />}
              </span>
            </button>
          );
        })}
      </div>

      <button className="primary-button continue-button" type="button" onClick={onContinue}>
        <span>Continuar</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

function DateScreen({
  monthCursor,
  setMonthCursor,
  calendarDays,
  selectedDate,
  selectedTime,
  loadingTimes,
  availableTimes,
  error,
  serviceDuration,
  onDateSelect,
  onTimeSelect,
  onContinue,
}: {
  monthCursor: Date;
  setMonthCursor: (date: Date) => void;
  calendarDays: { key: string; label: string; dateKey: string }[];
  selectedDate: string;
  selectedTime: string;
  loadingTimes: boolean;
  availableTimes: string[];
  error: string;
  serviceDuration: string;
  onDateSelect: (dateKey: string) => void;
  onTimeSelect: (time: string) => void;
  onContinue: () => void;
}) {
  const today = todayKey();

  function shiftMonth(direction: number) {
    setMonthCursor(
      new Date(monthCursor.getFullYear(), monthCursor.getMonth() + direction, 1),
    );
  }

  return (
    <div className="screen-content">
      <ScreenTitle
        title="Escolha a data e o horário"
        description="Selecione o dia e o horário que mais te atende."
      />

      <section className="calendar-card" aria-label="Calendário">
        <div className="calendar-header">
          <button className="icon-button" type="button" onClick={() => shiftMonth(-1)}>
            <ChevronLeft size={20} />
          </button>
          <strong>
            {monthLabels[monthCursor.getMonth()]} de {monthCursor.getFullYear()}
          </strong>
          <button className="icon-button" type="button" onClick={() => shiftMonth(1)}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="week-grid">
          {weekLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="days-grid">
          {calendarDays.map((day) => {
            if (!day.dateKey) return <span key={day.key} />;
            const date = parseDateKey(day.dateKey);
            const disabled = day.dateKey < today || date.getDay() === 0;
            const selected = selectedDate === day.dateKey;
            return (
              <button
                key={day.key}
                type="button"
                className={`${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                disabled={disabled}
                onClick={() => onDateSelect(day.dateKey)}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="times-section">
        <h3>Horários disponíveis</h3>
        {loadingTimes ? (
          <div className="loading-slots">
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : availableTimes.length > 0 ? (
          <div className="time-grid">
            {availableTimes.map((time) => (
              <button
                className={selectedTime === time ? "selected" : ""}
                key={time}
                type="button"
                onClick={() => onTimeSelect(time)}
              >
                {time}
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-state">Não há horários disponíveis para esta data.</p>
        )}
      </section>

      <div className="duration-note">
        <Clock3 size={18} />
        <span>Duração estimada do serviço: {serviceDuration}</span>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button continue-button" type="button" onClick={onContinue}>
        <span>Avançar</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

function ConfirmScreen({
  clientName,
  whatsapp,
  setClientName,
  setWhatsapp,
  service,
  selectedDate,
  selectedTime,
  error,
  success,
  submitting,
  onEdit,
  onConfirm,
  onNew,
}: {
  clientName: string;
  whatsapp: string;
  setClientName: (value: string) => void;
  setWhatsapp: (value: string) => void;
  service: (typeof services)[number];
  selectedDate: string;
  selectedTime: string;
  error: string;
  success: boolean;
  submitting: boolean;
  onEdit: () => void;
  onConfirm: () => void;
  onNew: () => void;
}) {
  if (success) {
    return (
      <div className="screen-content success-screen">
        <span className="success-mark">
          <Check size={34} />
        </span>
        <h2>Agendamento confirmado.</h2>
        <p>
          Seu horário foi reservado com elegância e precisão. Esperamos por você na
          NOIR BARBER.
        </p>
        <div className="summary-card success-summary">
          <strong>{service.name}</strong>
          <span>{formatLongDate(selectedDate)}</span>
          <span>{selectedTime}</span>
        </div>
        <button className="primary-button" type="button" onClick={onNew}>
          <span>Novo agendamento</span>
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="screen-content confirm-content">
      <ScreenTitle
        title="Seus dados"
        description="Informe seus dados para confirmar o agendamento."
      />

      <div className="field-group">
        <label htmlFor="clientName">Nome</label>
        <div className="field-shell">
          <User size={20} />
          <input
            id="clientName"
            autoComplete="name"
            value={clientName}
            placeholder="João Silva"
            onChange={(event) => setClientName(event.target.value)}
          />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="whatsapp">WhatsApp</label>
        <div className="field-shell">
          <Phone size={20} />
          <input
            id="whatsapp"
            autoComplete="tel"
            inputMode="tel"
            value={whatsapp}
            placeholder="(11) 98765-4321"
            onChange={(event) => setWhatsapp(event.target.value)}
          />
        </div>
      </div>

      <section className="summary-section">
        <div className="summary-title">
          <h3>Resumo do agendamento</h3>
          <button type="button" onClick={onEdit}>
            <PenLine size={16} />
            Editar
          </button>
        </div>

        <div className="summary-card">
          <img src={service.image} alt="" />
          <div className="summary-main">
            <strong>{service.name}</strong>
            <span>
              <Clock3 size={15} />
              {service.durationLabel}
              <small>|</small>
              {formatCurrency(service.priceCents)}
            </span>
          </div>
          <div className="summary-row">
            <CalendarDays size={17} />
            <span>{formatLongDate(selectedDate)}</span>
          </div>
          <div className="summary-row">
            <Clock3 size={17} />
            <span>{selectedTime}</span>
          </div>
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <button
        className="primary-button continue-button"
        type="button"
        onClick={onConfirm}
        disabled={submitting}
      >
        <span>{submitting ? "Confirmando..." : "Confirmar agendamento"}</span>
        <ArrowRight size={18} />
      </button>

      <p className="security-note">
        <LockKeyhole size={15} />
        Seus dados estão seguros.
      </p>
    </div>
  );
}
