"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repayLoanService = exports.disburseLoanService = exports.getMyLoans = exports.getAllLoansByBorrower = exports.getOpenLoansService = exports.fundLoanService = exports.getLenderDashboardData = exports.getBorrowerDashboardData = exports.createLoanService = void 0;
const client_1 = require("../../node_modules/.prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
// Utility function to convert duration to days for consistent calculations
const convertDurationToDays = (duration, unit) => {
    switch (unit) {
        case "DAYS":
            return duration;
        case "WEEKS":
            return duration * 7;
        case "MONTHS":
            return duration * 30; // Approximate 30 days per month
        case "YEARS":
            return duration * 365; // Approximate 365 days per year
        default:
            return duration * 30; // Default to months if unit is invalid
    }
};
// Utility function to convert duration to months for financial calculations
const convertDurationToMonths = (duration, unit) => {
    switch (unit) {
        case "DAYS":
            return duration / 30; // Approximate
        case "WEEKS":
            return duration / 4.33; // Approximate 4.33 weeks per month
        case "MONTHS":
            return duration;
        case "YEARS":
            return duration * 12;
        default:
            return duration; // Default to months if unit is invalid
    }
};
// Utility function to calculate total interest based on amount, rate, duration and unit
const calculateTotalInterest = (amountRequested, interestRate, duration, durationUnit) => {
    const ratePerPeriod = interestRate / 100;
    let periodsPerYear = 12;
    switch (durationUnit) {
        case client_1.DurationUnit.DAYS:
            periodsPerYear = 365;
            break;
        case client_1.DurationUnit.WEEKS:
            periodsPerYear = 52;
            break;
        case client_1.DurationUnit.YEARS:
            periodsPerYear = 1;
            break;
        case client_1.DurationUnit.MONTHS:
        default:
            periodsPerYear = 12;
            break;
    }
    const timeInYears = duration / periodsPerYear;
    const totalInterest = amountRequested * ratePerPeriod * timeInYears;
    return parseFloat(totalInterest.toFixed(2));
};
const DEFAULT_EARNINGS_RATE = 0.05; // 5% simplified earnings calculation
const MAX_NEW_LISTINGS = 10;
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
const getLoanCountByBorrower = async (borrowerId) => {
    return prisma_1.default.loan.count({
        where: { borrowerId },
    });
};
const getPendingLoanCountByBorrower = async (borrowerId) => {
    return prisma_1.default.loan.count({
        where: {
            borrowerId,
            status: client_1.LoanStatus.PENDING,
        },
    });
};
const getActiveLoansByBorrower = async (borrowerId) => {
    return prisma_1.default.loan.findMany({
        where: {
            borrowerId,
            status: {
                in: [client_1.LoanStatus.FUNDING, client_1.LoanStatus.PENDING],
            },
        },
    });
};
const getInvestmentsByLender = async (lenderId) => {
    return prisma_1.default.loan.findMany({
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
};
const getRecentLoanListings = async (limit = MAX_NEW_LISTINGS) => {
    return prisma_1.default.loan.findMany({
        where: { status: client_1.LoanStatus.PENDING },
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
};
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
const createLoanService = async (loanData) => {
    const durationUnit = loanData.durationUnit || "MONTHS";
    const totalInterest = calculateTotalInterest(loanData.amountRequested, loanData.interestRate, loanData.duration, durationUnit);
    const prismaLoanData = {
        title: loanData.title,
        description: loanData.description,
        amountRequested: loanData.amountRequested,
        interestRate: loanData.interestRate,
        duration: loanData.duration,
        durationUnit: durationUnit,
        totalInterest: totalInterest,
        borrower: {
            connect: { id: loanData.borrowerId },
        },
    };
    return prisma_1.default.loan.create({
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
};
exports.createLoanService = createLoanService;
/**
 * Get comprehensive dashboard data for a borrower
 * @param userId - Borrower's user ID
 * @returns Borrower dashboard data
 */
const getBorrowerDashboardData = async (userId) => {
    const [totalApplications, pendingApplications, activeLoans] = await Promise.all([
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
};
exports.getBorrowerDashboardData = getBorrowerDashboardData;
/**
 * Get comprehensive dashboard data for a lender
 * @param userId - Lender's user ID
 * @returns Lender dashboard data
 */
const getLenderDashboardData = async (userId) => {
    const [investments, newListings] = await Promise.all([
        getInvestmentsByLender(userId),
        getRecentLoanListings(),
    ]);
    const investmentSummary = calculateInvestmentSummary(investments);
    const formattedListings = formatLoanListings(newListings);
    return {
        investmentSummary,
        newListings: formattedListings,
    };
};
exports.getLenderDashboardData = getLenderDashboardData;
/**
 * Handles a lender's commitment to fund a loan (Phase 1: Escrow).
 * 1. Moves funds from Lender's availableBalance to escrowBalance (FUNDING_COMMIT).
 * 2. If 100% funded, changes status to FULLY_FUNDED, awaiting manual disbursement.
 */
const fundLoanService = async (loanId, lenderId, amount) => {
    const fundingAmountDecimal = amount;
    return prisma_1.default.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({ where: { id: loanId } });
        const lender = await tx.user.findUnique({
            where: { id: lenderId },
            select: { availableBalance: true, escrowBalance: true },
        });
        if (!loan)
            throw new Error("Loan not found.");
        if (!lender)
            throw new Error("Lender not found.");
        // SELF-FUNDING GATE: Prevent users from funding their own loans
        if (loan.borrowerId === lenderId) {
            throw new Error("Self-funding is prohibited. You cannot fund your own loan.");
        }
        if (lender.availableBalance.toNumber() < amount) {
            throw new Error("Insufficient available funds in wallet.");
        }
        // Only allow funding if not yet fully funded
        if (loan.status === client_1.LoanStatus.FULLY_FUNDED ||
            loan.status === client_1.LoanStatus.ACTIVE ||
            loan.status === client_1.LoanStatus.REPAID) {
            throw new Error("Loan is already fully funded or active.");
        }
        const remainingAmount = loan.amountRequested.toNumber() - loan.amountFunded.toNumber();
        const fundingAmount = Math.min(amount, remainingAmount);
        if (fundingAmount <= 0)
            throw new Error("Loan is already fully funded.");
        // 1. Debit the lender's AVAILABLE balance and credit their ESCROW balance
        await tx.user.update({
            where: { id: lenderId },
            data: {
                availableBalance: { decrement: fundingAmountDecimal },
                escrowBalance: { increment: fundingAmountDecimal },
            },
        });
        // 2. Record the commitment transaction
        await tx.transaction.create({
            data: {
                userId: lenderId,
                loanId: loanId,
                amount: fundingAmount,
                type: client_1.TransactionType.FUNDING_COMMIT,
                description: `Committed funds to loan: ${loanId}. Funds held in escrow.`,
            },
        });
        // 3. Update the loan's funded amount and status
        const newAmountFunded = loan.amountFunded.toNumber() + fundingAmount;
        let newLoanStatus = newAmountFunded >= loan.amountRequested.toNumber()
            ? client_1.LoanStatus.FULLY_FUNDED
            : client_1.LoanStatus.FUNDING;
        await tx.loan.update({
            where: { id: loanId },
            data: {
                amountFunded: newAmountFunded,
                status: newLoanStatus,
            },
        });
        if (newLoanStatus === client_1.LoanStatus.FULLY_FUNDED) {
            // Call the internal disbursement function immediately within the same transaction
            const disbursementResult = await (0, exports.disburseLoanService)(loanId);
            return {
                message: "Loan fully funded and automatically disbursed to borrower.",
                status: disbursementResult.status,
            };
        }
        return { message: "Loan funded successfully.", status: newLoanStatus };
    });
};
exports.fundLoanService = fundLoanService;
/**
 * Get open loans available for funding (excludes loans created by the current user)
 * Market View: Excludes loans where the authenticated user is the borrower
 */
const getOpenLoansService = async (page, pageSize, userId, // Added userId parameter for self-exclusion
query, minAmount, maxAmount, sortBy) => {
    const skip = (page - 1) * pageSize;
    // Build the dynamic 'where' clause for filtering and searching
    const where = {
        status: {
            in: [client_1.LoanStatus.PENDING, client_1.LoanStatus.FUNDING],
        },
        // MANDATORY: Exclude loans where the user is the borrower (Self-Funding Gate)
        borrowerId: {
            not: userId,
        },
    };
    if (query) {
        where.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
        ];
    }
    if (minAmount) {
        where.amountRequested = { ...where.amountRequested, gte: minAmount };
    }
    if (maxAmount) {
        where.amountRequested = { ...where.amountRequested, lte: maxAmount };
    }
    // Build the dynamic 'orderBy' clause for sorting
    const orderBy = sortBy ? {} : { createdAt: "desc" };
    if (sortBy) {
        const [field, direction] = sortBy.split("_");
        orderBy[field] = direction;
    }
    // Fetch the paginated loans
    const loans = await prisma_1.default.loan.findMany({
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
            durationUnit: true,
            totalInterest: true,
            principalRepaid: true,
            status: true,
            borrowerId: true,
            createdAt: true,
            updatedAt: true,
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
    const totalCount = await prisma_1.default.loan.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);
    // Map and normalize returned loans to plain objects and convert Decimals
    const mappedLoans = loans.map((loan) => ({
        id: loan.id,
        title: loan.title,
        description: loan.description,
        amountRequested: convertDecimalToNumber(loan.amountRequested),
        amountFunded: convertDecimalToNumber(loan.amountFunded),
        interestRate: convertDecimalToNumber(loan.interestRate),
        duration: loan.duration,
        durationUnit: loan.durationUnit,
        totalInterest: convertDecimalToNumber(loan.totalInterest),
        principalRepaid: convertDecimalToNumber(loan.principalRepaid),
        status: loan.status,
        borrowerId: loan.borrowerId,
        borrower: loan.borrower,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
    }));
    return { loans: mappedLoans, totalCount, totalPages };
};
exports.getOpenLoansService = getOpenLoansService;
/**
 * Get all loans created by a borrower regardless of status
 * @param borrowerId - Borrower's user ID
 * @returns Array of loans with details
 */
const getAllLoansByBorrower = async (borrowerId, page = 1, pageSize = 10, q, minAmount, maxAmount, status) => {
    const skip = (page - 1) * pageSize;
    const where = { borrowerId };
    if (q) {
        const searchTermUpper = q.toUpperCase();
        const orConditions = [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
        ];
        // If the search term matches a valid status, also filter by status
        const validStatuses = ["PENDING", "FUNDING", "FUNDED", "REPAID"];
        if (validStatuses.includes(searchTermUpper)) {
            where.status = searchTermUpper;
        }
        where.OR = orConditions;
    }
    if (minAmount) {
        where.amountRequested = { ...where.amountRequested, gte: minAmount };
    }
    if (maxAmount) {
        where.amountRequested = { ...where.amountRequested, lte: maxAmount };
    }
    if (status) {
        const statusUpper = status.toUpperCase();
        const validStatuses = ["PENDING", "FUNDING", "FUNDED", "REPAID"];
        if (validStatuses.includes(statusUpper)) {
            where.status = statusUpper;
        }
    }
    const loans = await prisma_1.default.loan.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
    });
    const totalCount = await prisma_1.default.loan.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const mapped = loans.map((loan) => ({
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
    }));
    return { loans: mapped, totalCount, totalPages };
};
exports.getAllLoansByBorrower = getAllLoansByBorrower;
/**
 * Get user's loans where they are either borrower or lender
 * Private View: Includes all loans where the authenticated user is either the borrower OR the lender
 */
const getMyLoans = async (userId, page = 1, pageSize = 10, query, minAmount, maxAmount, status) => {
    const skip = (page - 1) * pageSize;
    // Base where clause using OR condition for borrower or lender
    const where = {
        OR: [
            { borrowerId: userId }, // User is the borrower
            { fundedBy: { some: { id: userId } } }, // User is a lender (has funded this loan)
        ],
    };
    // Add search functionality
    if (query) {
        const searchTermUpper = query.toUpperCase();
        const orConditions = [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
        ];
        // If the search term matches a valid status, also filter by status
        const validStatuses = [
            "PENDING",
            "FUNDING",
            "FULLY_FUNDED",
            "ACTIVE",
            "REPAID",
        ];
        if (validStatuses.includes(searchTermUpper)) {
            where.status = searchTermUpper;
        }
        // Combine OR conditions with existing where clause
        where.AND = [
            { OR: where.OR }, // Keep the borrower/lender OR condition
            { OR: orConditions }, // Add search OR conditions
        ];
        delete where.OR; // Remove the top-level OR since we're using AND now
    }
    // Add amount filters
    if (minAmount || maxAmount) {
        where.amountRequested = {};
        if (minAmount) {
            where.amountRequested.gte = minAmount;
        }
        if (maxAmount) {
            where.amountRequested.lte = maxAmount;
        }
    }
    // Add status filter
    if (status) {
        const statusUpper = status.toUpperCase();
        const validStatuses = [
            "PENDING",
            "FUNDING",
            "FULLY_FUNDED",
            "ACTIVE",
            "REPAID",
        ];
        if (validStatuses.includes(statusUpper)) {
            where.status = statusUpper;
        }
    }
    const [loans, totalCount] = await Promise.all([
        prisma_1.default.loan.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
                borrower: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                fundedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        }),
        prisma_1.default.loan.count({ where }),
    ]);
    const totalPages = Math.ceil(totalCount / pageSize);
    // Transform loans to include user's role in each loan
    const loansWithDetails = loans.map((loan) => ({
        id: loan.id,
        title: loan.title,
        description: loan.description,
        amountRequested: convertDecimalToNumber(loan.amountRequested),
        amountFunded: convertDecimalToNumber(loan.amountFunded),
        interestRate: convertDecimalToNumber(loan.interestRate),
        duration: loan.duration,
        durationUnit: loan.durationUnit,
        totalInterest: convertDecimalToNumber(loan.totalInterest),
        principalRepaid: convertDecimalToNumber(loan.principalRepaid),
        status: loan.status,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
        borrower: loan.borrower,
        fundedBy: loan.fundedBy,
        // Add user's role in this specific loan
        userRole: loan.borrowerId === userId ? "BORROWER" : "LENDER",
    }));
    return {
        loans: loansWithDetails,
        totalCount,
        totalPages,
    };
};
exports.getMyLoans = getMyLoans;
/**
 * Manually triggered after a loan reaches FULLY_FUNDED status.
 * 1. Clears escrow balances of all lenders (FUNDING_RELEASE).
 * 2. Credits the borrower's available balance (DISBURSEMENT).
 * 3. Sets the loan status to ACTIVE.
 */
const disburseLoanService = async (loanId) => {
    return prisma_1.default.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({ where: { id: loanId } });
        if (!loan)
            throw new Error("Loan not found.");
        // Check for the correct status before disbursement
        if (loan.status !== client_1.LoanStatus.FULLY_FUNDED) {
            throw new Error(`Loan status is ${loan.status}. Only FULLY_FUNDED loans can be disbursed.`);
        }
        const disbursementAmount = loan.amountRequested.toNumber();
        // 1. Find all funding commitments to calculate contribution shares
        const fundingTransactions = await tx.transaction.findMany({
            where: { loanId: loanId, type: client_1.TransactionType.FUNDING_COMMIT },
            select: { userId: true, amount: true },
        });
        // Aggregate commitments by lender ID
        const lenderCommitments = fundingTransactions.reduce((acc, tx) => {
            acc[tx.userId] = (acc[tx.userId] || 0) + tx.amount.toNumber();
            return acc;
        }, {});
        // 2. CLEAR EACH LENDER'S ESCROW BALANCE
        for (const [contributorId, committedAmount] of Object.entries(lenderCommitments)) {
            const committedAmountDecimal = committedAmount;
            // a. Debit the lender's escrowBalance (clearing the hold)
            await tx.user.update({
                where: { id: contributorId },
                data: { escrowBalance: { decrement: committedAmountDecimal } },
            });
            // b. Record the funding release transaction
            await tx.transaction.create({
                data: {
                    userId: contributorId,
                    loanId: loanId,
                    amount: committedAmount,
                    type: client_1.TransactionType.FUNDING_RELEASE,
                    description: "Funds released from escrow; investment is now active principal.",
                },
            });
        }
        // 3. Credit the borrower's available balance
        await tx.user.update({
            where: { id: loan.borrowerId },
            data: { availableBalance: { increment: disbursementAmount } },
        });
        // 4. Record the disbursement transaction (Borrower receiving the funds)
        await tx.transaction.create({
            data: {
                userId: loan.borrowerId,
                loanId: loanId,
                amount: disbursementAmount,
                type: client_1.TransactionType.DISBURSEMENT,
                description: "Loan funds disbursed to borrower",
            },
        });
        // 5. Set loan status to ACTIVE
        await tx.loan.update({
            where: { id: loanId },
            data: { status: client_1.LoanStatus.ACTIVE },
        });
        return {
            message: "Loan successfully disbursed to borrower.",
            status: client_1.LoanStatus.ACTIVE,
        };
    });
};
exports.disburseLoanService = disburseLoanService;
// --- repayLoanService: PRO-RATA DISTRIBUTION ---
/**
 * Handles a borrower's repayment and distributes principal and interest pro-rata to all lenders.
 * Repayment is only allowed when the loan status is ACTIVE.
 */
const repayLoanService = async (loanId, borrowerId, paymentAmount) => {
    const paymentAmountDecimal = paymentAmount; // Using number for Prisma decrement/increment
    return prisma_1.default.$transaction(async (tx) => {
        // 1. Fetch loan and borrower data
        const loan = await tx.loan.findUnique({
            where: { id: loanId },
            select: {
                id: true,
                borrowerId: true,
                status: true,
                amountRequested: true,
                principalRepaid: true,
                totalInterest: true,
                duration: true,
            },
        });
        if (!loan)
            throw new Error("Loan not found.");
        if (loan.borrowerId !== borrowerId)
            throw new Error("User is not the borrower for this loan.");
        // IMPORTANT CONSTRAINT 1: Loan must be ACTIVE to be repaid
        if (loan.status !== client_1.LoanStatus.ACTIVE) {
            throw new Error("Loan is not in an ACTIVE state for repayment. Status must be ACTIVE.");
        }
        const borrower = await tx.user.findUnique({
            where: { id: borrowerId },
            select: { availableBalance: true, escrowBalance: true },
        });
        if (!borrower || borrower.availableBalance.toNumber() < paymentAmount) {
            throw new Error("Insufficient available funds to make repayment.");
        }
        // 2. DETERMINE FIXED INSTALLMENT PORTIONS (Enforcing Exact Payment)
        const totalPeriods = loan.duration;
        // Calculate the fixed principal portion per period
        const principalPerPeriod = loan.amountRequested.toNumber() / totalPeriods;
        // Calculate the fixed interest portion per period
        const interestPerPeriod = loan.totalInterest.toNumber() / totalPeriods;
        // Calculate the exact installment required (rounding to 2 decimal places)
        // This is the CRITICAL value that must be enforced.
        const requiredInstallmentAmount = parseFloat((principalPerPeriod + interestPerPeriod).toFixed(2));
        // Normalize the incoming payment amount for comparison
        const normalizedPaymentAmount = parseFloat(paymentAmount.toFixed(2));
        // IMPORTANT CONSTRAINT 2: Exact Payment Amount Check
        if (normalizedPaymentAmount !== requiredInstallmentAmount) {
            throw new Error(`Repayment amount must be exactly the required installment of $${requiredInstallmentAmount.toFixed(2)}.`);
        }
        // Use the calculated fixed portions for the transaction
        const principalPortion = principalPerPeriod;
        const interestPortion = interestPerPeriod;
        // 3. DEBIT BORROWER & UPDATE LOAN STATUS
        await tx.user.update({
            where: { id: borrowerId },
            data: { availableBalance: { decrement: paymentAmountDecimal } },
        });
        const newPrincipalRepaid = loan.principalRepaid.toNumber() + principalPortion;
        let newStatus = newPrincipalRepaid >= loan.amountRequested.toNumber()
            ? client_1.LoanStatus.REPAID
            : loan.status;
        await tx.loan.update({
            where: { id: loanId },
            data: {
                principalRepaid: newPrincipalRepaid,
                status: newStatus,
            },
        });
        // Record borrower's repayment transaction
        await tx.transaction.create({
            data: {
                userId: borrowerId,
                loanId: loanId,
                amount: paymentAmount,
                type: client_1.TransactionType.REPAYMENT,
                description: `Loan repayment made. Principal: ${principalPortion.toFixed(2)}, Interest: ${interestPortion.toFixed(2)}`,
            },
        });
        // 4. DISTRIBUTE FUNDS TO LENDERS (PRO-RATA)
        // Find original FUNDING_COMMIT transactions to calculate contribution shares
        const fundingTransactions = await tx.transaction.findMany({
            where: { loanId: loanId, type: client_1.TransactionType.FUNDING_COMMIT },
            select: { userId: true, amount: true },
        });
        const lenderContributions = fundingTransactions.reduce((acc, tx) => {
            acc[tx.userId] = (acc[tx.userId] || 0) + tx.amount.toNumber();
            return acc;
        }, {});
        const totalFunded = loan.amountRequested.toNumber();
        // Distribute the repayment (Principal + Interest)
        for (const [lenderId, fundedAmount] of Object.entries(lenderContributions)) {
            const share = fundedAmount / totalFunded;
            const principalShare = principalPortion * share;
            const interestShare = interestPortion * share;
            const creditAmount = principalShare + interestShare;
            const creditAmountDecimal = creditAmount;
            // Credit the lender's available balance
            await tx.user.update({
                where: { id: lenderId },
                data: { availableBalance: { increment: creditAmountDecimal } },
            });
            // Record distribution transaction for the lender
            await tx.transaction.create({
                data: {
                    userId: lenderId,
                    loanId: loanId,
                    amount: creditAmount,
                    type: client_1.TransactionType.REPAYMENT,
                    description: `Repayment received. P: ${principalShare.toFixed(2)}, I: ${interestShare.toFixed(2)}`,
                },
            });
        }
        return {
            message: "Repayment successfully processed.",
            newStatus: newStatus,
        };
    });
};
exports.repayLoanService = repayLoanService;
