"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
exports.default = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Setting up test database
        // Set environment for testing
        process.env.NODE_ENV = "test";
        process.env.DATABASE_URL = "file:./test.db";
        // Remove existing test database if it exists
        const testDbPath = path_1.default.join(__dirname, "../../test.db");
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        const testSchemaPath = path_1.default.resolve(__dirname, "prisma/schema.prisma");
        // Push the schema to create the database structure using SQLite
        (0, child_process_1.execSync)(`DATABASE_URL="file:./test.db" npx prisma db push --schema=${testSchemaPath} --skip-generate --accept-data-loss`, {
            stdio: "inherit",
        });
        // Generate Prisma client for tests
        (0, child_process_1.execSync)(`DATABASE_URL="file:./test.db" npx prisma generate --schema=${testSchemaPath}`, {
            stdio: "inherit",
        });
        // Test database setup complete
    }
    catch (error) {
        // Failed to set up test database
        process.exit(1);
    }
});
