import { describe, it, expect, beforeEach } from 'vitest';

// Mock Clarity environment
const mockClarity = {
  txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  blockHeight: 100,
  principals: {
    owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    supplier1: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
    supplier2: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
  },
  maps: {
    verifiedSuppliers: new Map(),
    supplierDetails: new Map()
  },
  vars: {
    contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
  }
};

// Mock contract functions
const contract = {
  verifySupplier: (supplier, name, registrationNumber, country) => {
    if (mockClarity.txSender !== mockClarity.vars.contractOwner) {
      return { type: 'err', value: 1 };
    }
    
    mockClarity.maps.verifiedSuppliers.set(supplier, true);
    mockClarity.maps.supplierDetails.set(supplier, {
      name,
      'registration-number': registrationNumber,
      country,
      'verification-date': mockClarity.blockHeight,
      verifier: mockClarity.txSender
    });
    
    return { type: 'ok', value: true };
  },
  
  revokeVerification: (supplier) => {
    if (mockClarity.txSender !== mockClarity.vars.contractOwner) {
      return { type: 'err', value: 1 };
    }
    
    mockClarity.maps.verifiedSuppliers.delete(supplier);
    mockClarity.maps.supplierDetails.delete(supplier);
    
    return { type: 'ok', value: true };
  },
  
  isVerified: (supplier) => {
    return mockClarity.maps.verifiedSuppliers.get(supplier) || false;
  },
  
  getSupplierDetails: (supplier) => {
    return mockClarity.maps.supplierDetails.get(supplier) || null;
  },
  
  transferOwnership: (newOwner) => {
    if (mockClarity.txSender !== mockClarity.vars.contractOwner) {
      return { type: 'err', value: 1 };
    }
    
    mockClarity.vars.contractOwner = newOwner;
    return { type: 'ok', value: true };
  }
};

describe('Supplier Verification Contract', () => {
  beforeEach(() => {
    // Reset state before each test
    mockClarity.txSender = mockClarity.principals.owner;
    mockClarity.maps.verifiedSuppliers.clear();
    mockClarity.maps.supplierDetails.clear();
    mockClarity.vars.contractOwner = mockClarity.principals.owner;
  });
  
  it('should verify a supplier successfully', () => {
    const result = contract.verifySupplier(
        mockClarity.principals.supplier1,
        'Acme Corp',
        'REG123456',
        'USA'
    );
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(contract.isVerified(mockClarity.principals.supplier1)).toBe(true);
    
    const details = contract.getSupplierDetails(mockClarity.principals.supplier1);
    expect(details).toEqual({
      name: 'Acme Corp',
      'registration-number': 'REG123456',
      country: 'USA',
      'verification-date': mockClarity.blockHeight,
      verifier: mockClarity.principals.owner
    });
  });
  
  it('should not allow non-owners to verify suppliers', () => {
    mockClarity.txSender = mockClarity.principals.supplier1;
    
    const result = contract.verifySupplier(
        mockClarity.principals.supplier2,
        'Test Corp',
        'REG789012',
        'Canada'
    );
    
    expect(result).toEqual({ type: 'err', value: 1 });
    expect(contract.isVerified(mockClarity.principals.supplier2)).toBe(false);
  });
  
  it('should revoke verification successfully', () => {
    // First verify a supplier
    contract.verifySupplier(
        mockClarity.principals.supplier1,
        'Acme Corp',
        'REG123456',
        'USA'
    );
    
    // Then revoke verification
    const result = contract.revokeVerification(mockClarity.principals.supplier1);
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(contract.isVerified(mockClarity.principals.supplier1)).toBe(false);
    expect(contract.getSupplierDetails(mockClarity.principals.supplier1)).toBe(null);
  });
  
  it('should transfer ownership successfully', () => {
    const result = contract.transferOwnership(mockClarity.principals.supplier1);
    
    expect(result).toEqual({ type: 'ok', value: true });
    expect(mockClarity.vars.contractOwner).toBe(mockClarity.principals.supplier1);
    
    // Original owner should no longer be able to verify suppliers
    mockClarity.txSender = mockClarity.principals.owner;
    const verifyResult = contract.verifySupplier(
        mockClarity.principals.supplier2,
        'Test Corp',
        'REG789012',
        'Canada'
    );
    
    expect(verifyResult).toEqual({ type: 'err', value: 1 });
  });
});
