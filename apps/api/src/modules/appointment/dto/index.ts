export class CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  type: 'NEW' | 'FOLLOW_UP';
  mode: 'IN_PERSON' | 'VIDEO' | 'PHONE';
  reason?: string;
}

export class RescheduleAppointmentDto {
  newDate: string;
  newTime: string;
}
