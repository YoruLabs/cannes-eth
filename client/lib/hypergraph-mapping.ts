import { Id } from '@graphprotocol/grc-20';
import type { Mapping } from '@graphprotocol/hypergraph';

export const mapping: Mapping = {
  Patient: {
    typeIds: [Id.Id('c1b1f1e1-1111-4111-8111-111111111111')],
    properties: {
      name: Id.Id('c1b1f1e1-2222-4222-8222-222222222222'),
      age: Id.Id('c1b1f1e1-3333-4333-8333-333333333333'),
      email: Id.Id('c1b1f1e1-4444-4444-8444-444444444444'),
    },
  },
  HealthProvider: {
    typeIds: [Id.Id('c1b1f1e1-5555-4555-8555-555555555555')],
    properties: {
      name: Id.Id('c1b1f1e1-6666-4666-8666-666666666666'),
      type: Id.Id('c1b1f1e1-7777-4777-8777-777777777777'),
      city: Id.Id('c1b1f1e1-8888-4888-8888-888888888888'),
    },
  },
}; 