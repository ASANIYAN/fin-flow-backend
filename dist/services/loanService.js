"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenLoansService = exports.fundLoanService = exports.getLenderDashboardData = exports.getBorrowerDashboardData = exports.createLoanService = void 0;
const prisma_1 = require("../lib/prisma");
const DEFAULT_EARNINGS_RATE = 0.05; // 5% simplified earnings calculation
const MAX_NEW_LISTINGS = 10;
const prisma = new prisma_1.PrismaClient();
const calculateProgress = (amountFunded, amountRequested) => {
    if (amountRequested === 0)
        return 0;
    return (amountFunded / amountRequested) * 100;
};
const formatBorrowerName = (firstName, lastName) => {
    return `${firstName} ${lastName}`;
};
const convertDecimalToNumber = (decimal) => {
    if (decimal && typeof decimal === "object" && "toNumber" in decimal) {
        return decimal.toNumber();
    }
    return Number(decimal) || 0;
};
const getLoanCountByBorrower = (borrowerId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.loan.count({
        where: { borrowerId },
    });
});
const getPendingLoanCountByBorrower = (borrowerId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.loan.count({
        where: {
            borrowerId,
            status: prisma_1.LoanStatus.PENDING,
        },
    });
});
const getActiveLoansByBorrower = (borrowerId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.loan.findMany({
        where: {
            borrowerId,
            status: {
                in: [prisma_1.LoanStatus.FUNDING, prisma_1.LoanStatus.FUNDED],
            },
        },
    });
});
const getInvestmentsByLender = (lenderId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.loan.findMany({
        where: {
            fundedBy: {
                some: { id: lenderId },
            },
        },
        select: {
            amountFunded: true,
            interestRate: true,
        },
    });
});
const getRecentLoanListings = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = MAX_NEW_LISTINGS) {
    return prisma.loan.findMany({
        where: { status: prisma_1.LoanStatus.PENDING },
        take: limit,
        include: {
            borrower: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
});
const calculateInvestmentSummary = (investments) => {
    const totalInvested = investments.reduce((sum, loan) => sum + convertDecimalToNumber(loan.amountFunded), 0);
    // Simplified earnings calculation - should be more sophisticated later on
    const totalEarnings = totalInvested * DEFAULT_EARNINGS_RATE;
    const activeInvestments = investments.length;
    return {
        totalInvested,
        totalEarnings,
        activeInvestments,
    };
};
const formatLoanListings = (loans) => {
    return loans.map((loan) => ({
        id: loan.id,
        title: loan.title,
        description: loan.description,
        amountRequested: convertDecimalToNumber(loan.amountRequested),
        amountFunded: convertDecimalToNumber(loan.amountFunded),
        interestRate: convertDecimalToNumber(loan.interestRate),
        duration: loan.duration,
        status: loan.status,
        borrower: formatBorrowerName(loan.borrower.firstName, loan.borrower.lastName),
        progress: calculateProgress(convertDecimalToNumber(loan.amountFunded), convertDecimalToNumber(loan.amountRequested)),
        createdAt: loan.createdAt,
    }));
};
/**
 * Create a new loan application
 * @param loanData - Loan creation data
 * @returns Created loan object
 */
const createLoanService = (loanData) => __awaiter(void 0, void 0, void 0, function* () {
    const prismaLoanData = {
        title: loanData.title,
        description: loanData.description,
        amountRequested: loanData.amountRequested,
        interestRate: loanData.interestRate,
        duration: loanData.duration,
        borrower: {
            connect: { id: loanData.borrowerId },
        },
    };
    return prisma.loan.create({
        data: prismaLoanData,
        include: {
            borrower: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
});
exports.createLoanService = createLoanService;
/**
 * Get comprehensive dashboard data for a borrower
 * @param userId - Borrower's user ID
 * @returns Borrower dashboard data
 */
const getBorrowerDashboardData = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const [totalApplications, pendingApplications, activeLoans] = yield Promise.all([
        getLoanCountByBorrower(userId),
        getPendingLoanCountByBorrower(userId),
        getActiveLoansByBorrower(userId),
    ]);
    return {
        totalApplications,
        pendingApplications,
        activeLoans: activeLoans.map((loan) => ({
            id: loan.id,
            title: loan.title,
            description: loan.description,
            amountRequested: convertDecimalToNumber(loan.amountRequested),
            amountFunded: convertDecimalToNumber(loan.amountFunded),
            interestRate: convertDecimalToNumber(loan.interestRate),
            duration: loan.duration,
            status: loan.status,
            createdAt: loan.createdAt,
            updatedAt: loan.updatedAt,
        })),
    };
});
exports.getBorrowerDashboardData = getBorrowerDashboardData;
/**
 * Get comprehensive dashboard data for a lender
 * @param userId - Lender's user ID
 * @returns Lender dashboard data
 */
const getLenderDashboardData = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const [investments, newListings] = yield Promise.all([
        getInvestmentsByLender(userId),
        getRecentLoanListings(),
    ]);
    const investmentSummary = calculateInvestmentSummary(investments);
    const formattedListings = formatLoanListings(newListings);
    return {
        investmentSummary,
        newListings: formattedListings,
    };
});
exports.getLenderDashboardData = getLenderDashboardData;
const fundLoanService = (loanId, lenderId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Get lender and loan data, and lock the records
        const lender = yield prisma.user.findUnique({
            where: { id: lenderId },
        });
        const loan = yield prisma.loan.findUnique({
            where: { id: loanId },
        });
        if (!lender || lender.balance.toNumber() < amount) {
            throw new Error("Insufficient funds in wallet.");
        }
        // 2. Determine the exact amount to fund
        const remainingAmount = loan.amountRequested.toNumber() - loan.amountFunded.toNumber();
        const fundingAmount = Math.min(amount, remainingAmount);
        if (fundingAmount <= 0) {
            throw new Error("Loan is already fully funded or not available for funding.");
        }
        // 3. Debit the lender's wallet
        const newLenderBalance = lender.balance.toNumber() - fundingAmount;
        yield prisma.user.update({
            where: { id: lenderId },
            data: { balance: newLenderBalance },
        });
        yield prisma.transaction.create({
            data: {
                userId: lenderId,
                loanId: loanId,
                amount: fundingAmount,
                type: "FUNDING_DEBIT",
                description: "Contribution to loan funding",
            },
        });
        // 4. Update the loan's funded amount
        const newAmountFunded = loan.amountFunded.toNumber() + fundingAmount;
        let newLoanStatus = loan.status;
        // 5. Check if the loan is fully funded and update status
        if (newAmountFunded >= loan.amountRequested.toNumber()) {
            newLoanStatus = prisma_1.LoanStatus.FUNDED;
            // 6. Automatically credit the borrower's wallet
            const borrower = yield prisma.user.findUnique({
                where: { id: loan.borrowerId },
            });
            if (borrower) {
                const newBorrowerBalance = borrower.balance.toNumber() + loan.amountRequested.toNumber();
                yield prisma.user.update({
                    where: { id: borrower.id },
                    data: { balance: newBorrowerBalance },
                });
                // Record the disbursement transaction
                yield prisma.transaction.create({
                    data: {
                        userId: borrower.id,
                        loanId: loanId,
                        amount: loan.amountRequested.toNumber(),
                        type: "DISBURSEMENT",
                        description: "Loan funds disbursed to borrower",
                    },
                });
            }
        }
        // Update loan record with new funded amount and status
        yield prisma.loan.update({
            where: { id: loanId },
            data: {
                amountFunded: newAmountFunded,
                status: newLoanStatus,
            },
        });
        return { message: "Loan funded successfully." };
    }));
});
exports.fundLoanService = fundLoanService;
const getOpenLoansService = (page, pageSize, query, minAmount, maxAmount, sortBy) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * pageSize;
    // Build the dynamic 'where' clause for filtering and searching
    const where = {
        status: {
            in: [prisma_1.LoanStatus.PENDING, prisma_1.LoanStatus.FUNDING],
        },
    };
    if (query) {
        where.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
        ];
    }
    if (minAmount) {
        where.amountRequested = Object.assign(Object.assign({}, where.amountRequested), { gte: minAmount });
    }
    if (maxAmount) {
        where.amountRequested = Object.assign(Object.assign({}, where.amountRequested), { lte: maxAmount });
    }
    // Build the dynamic 'orderBy' clause for sorting
    const orderBy = sortBy ? {} : { createdAt: "desc" };
    if (sortBy) {
        const [field, direction] = sortBy.split("_");
        orderBy[field] = direction;
    }
    // Fetch the paginated loans
    const loans = yield prisma.loan.findMany({
        where,
        skip,
        take: pageSize,
        select: {
            id: true,
            title: true,
            description: true,
            amountRequested: true,
            amountFunded: true,
            interestRate: true,
            duration: true,
            createdAt: true,
            borrower: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy,
    });
    // Get the total count of loans for pagination (without skip/take)
    const totalCount = yield prisma.loan.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);
    return { loans, totalCount, totalPages };
});
exports.getOpenLoansService = getOpenLoansService;
