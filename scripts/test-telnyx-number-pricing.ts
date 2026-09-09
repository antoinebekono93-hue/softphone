import assert from 'node:assert/strict';
import { resellerNumberPrice, telnyxAcquisitionCost } from '../lib/telnyx-number-pricing';

assert.equal(telnyxAcquisitionCost({ upfront_cost: '3.21', monthly_cost: '6.54' }), 3.21);
assert.equal(telnyxAcquisitionCost({ upfront_cost: '0', monthly_cost: '6.54' }), 6.54);
assert.equal(telnyxAcquisitionCost({}), null);
assert.equal(telnyxAcquisitionCost({ upfront_cost: 'not-a-price' }), null);

assert.equal(resellerNumberPrice({
  costInformation: { upfront_cost: '3.21' },
  multiplier: 2,
  fixedMarkup: 0.5,
}), 6.92);
assert.equal(resellerNumberPrice({
  costInformation: undefined,
  multiplier: 2.5,
  fixedMarkup: 0,
}), null);
assert.equal(resellerNumberPrice({
  costInformation: { upfront_cost: '1' },
  multiplier: -1,
  fixedMarkup: 0,
}), null);

console.log('PASS  tarification réelle des numéros Telnyx (7 contrôles)');
