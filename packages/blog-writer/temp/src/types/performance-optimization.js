"use strict";
/**
 * Week 11-12 Performance Optimization Types
 * Comprehensive types for content performance tracking, A/B testing,
 * engagement prediction, and optimization recommendations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceOptimizationError = void 0;
// ===== ERROR TYPES =====
class PerformanceOptimizationError extends Error {
    constructor(message, code, type, details) {
        super(message);
        this.name = 'PerformanceOptimizationError';
        this.code = code;
        this.type = type;
        this.details = details;
    }
}
exports.PerformanceOptimizationError = PerformanceOptimizationError;
