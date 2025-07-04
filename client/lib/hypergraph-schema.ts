import { Entity, Type } from '@graphprotocol/hypergraph';

// Simple patient entity
export class Patient extends Entity.Class<Patient>('Patient')({
  name: Type.Text,
  age: Type.Number,
  email: Type.Text,
}) {}

// Health provider entity  
export class HealthProvider extends Entity.Class<HealthProvider>('HealthProvider')({
  name: Type.Text,
  type: Type.Text,
  city: Type.Text,
}) {} 