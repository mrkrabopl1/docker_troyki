import axios from "axios";

// ============================================================
// TYPES
// ============================================================

export type CustomerData = {
    id: number;
    name: string;
    secondName: string;
    mail: string;
    phone: string;
};

export type Address = {
    id: number;
    town: string;
    street?: string | null;
    house?: string | null;
    flat?: string | null;
    index?: string | null;
    region?: string | null;
    settlement?: string | null;
    coordinates: number[];
    is_default: boolean;
};

export type UpdateProfilePayload = {
    name?: string;
    second_name?: string;
    phone?: string;
};

type userDataType = {
    pass: string;
    mail: string;
};

type loginDataType = {
    mail: string;
    pass: string;
};

type changePassType = {
    newPass: string;
    oldPass: string;
};

// ============================================================
// AUTH — REGISTER / LOGIN / LOGOUT / ME
// ============================================================

export const registerUser = (data: userDataType, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/auth/register`,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        data: JSON.stringify(data),
    }).then(
        (res) => callback(res.data),
        (error) => {
            console.warn('[registerUser]', error);
            callback(error.response?.data ?? { registerIndex: 2, error: 'Network error' });
        }
    );
};

export const loginUser = (data: loginDataType, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/auth/login`,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        data: JSON.stringify(data),
    }).then(
        (res) => callback(res.data),
        (error) => {
            console.warn('[loginUser]', error);
            callback(error.response);
        }
    );
};

export const unlogin = (callback: (val: any) => void) => {
    axios({
        withCredentials: true,
        method: 'post',
        url: `${API_URL}/auth/logout`,
    }).then(
        (res) => callback(res.data),
        (error) => {
            console.warn('[unlogin]', error);
            callback(null);
        }
    );
};

/**
 * GET /auth/me — проверка сессии.
 * 200 + user — залогинен, 200 + null — гость.
 */
export const getMe = async (): Promise<CustomerData | null> => {
    try {
        const res = await axios({
            method: 'get',
            url: `${API_URL}/auth/me`,
            withCredentials: true,
        });
        return res.data ?? null;
    } catch (error: any) {
        if (error?.response?.status === 401) return null;
        console.warn('[getMe]', error);
        return null;
    }
};

// ============================================================
// PROFILE — UPDATE
// ============================================================

export const updateProfile = async (data: UpdateProfilePayload): Promise<CustomerData> => {
    const res = await axios({
        method: 'post',
        url: `${API_URL}/auth/profile`,
        withCredentials: true,
        data,
    });
    return res.data;
};

// ============================================================
// ADDRESSES — CRUD
// ============================================================

export const getAddresses = async (): Promise<Address[]> => {
    try {
        const res = await axios({
            method: 'get',
            url: `${API_URL}/auth/addresses`,
            withCredentials: true,
        });
        return res.data ?? [];
    } catch (err: any) {
        if (err?.response?.status === 401) return [];
        console.warn('[getAddresses]', err);
        return [];
    }
};

export const getAddress = async (id: number): Promise<Address | null> => {
    try {
        const res = await axios({
            method: 'get',
            url: `${API_URL}/auth/addresses/${id}`,
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        if (err?.response?.status === 404) return null;
        console.warn('[getAddress]', err);
        return null;
    }
};

export const getDefaultAddress = async (): Promise<Address | null> => {
    try {
        const res = await axios({
            method: 'get',
            url: `${API_URL}/auth/addresses/default`,
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        if (err?.response?.status === 404) return null;
        console.warn('[getDefaultAddress]', err);
        return null;
    }
};

export const createAddress = async (data: Omit<Address, 'id'>): Promise<Address> => {
    const res = await axios({
        method: 'post',
        url: `${API_URL}/auth/addresses`,
        withCredentials: true,
        data,
    });
    return res.data;
};

export const updateAddress = async (id: number, data: Partial<Address>): Promise<Address> => {
    const res = await axios({
        method: 'put',
        url: `${API_URL}/auth/addresses/${id}`,
        withCredentials: true,
        data,
    });
    return res.data;
};

export const deleteAddress = async (id: number): Promise<void> => {
    await axios({
        method: 'delete',
        url: `${API_URL}/auth/addresses/${id}`,
        withCredentials: true,
    });
};

export const setDefaultAddress = async (id: number): Promise<void> => {
    await axios({
        method: 'patch',
        url: `${API_URL}/auth/addresses/${id}/default`,
        withCredentials: true,
    });
};

// ============================================================
// ORDERS — HISTORY
// ============================================================

export const getOrderHistory = async () => {
    try {
        const res = await axios({
            method: 'get',
            url: `${API_URL}/orders/my`,
            withCredentials: true,
        });
        return res.data ?? [];
    } catch (err: any) {
        if (err?.response?.status === 401) return [];
        console.warn('[getOrderHistory]', err);
        return [];
    }
};

// ============================================================
// VERIFY EMAIL
// ============================================================

export const verifyEmail = (token: string, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/auth/verify-email`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ token }),
    }).then(
        (res) => callback(res.data),
        (error) => {
            console.warn('[verifyEmail]', error);
            callback(error.response?.data ?? null);
        }
    );
};

// ============================================================
// PASSWORD
// ============================================================

export const changeUserPass = (data: changePassType, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/users/password`,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        data: JSON.stringify(data),
    }).then(
        (res) => callback(res.data),
        (error) => {
            console.warn('[changeUserPass]', error);
            callback(error.response?.data ?? null);
        }
    );
};

export const updatePass = (mail: string, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/users/password/forgot?mail=${encodeURIComponent(mail)}`,
        withCredentials: true,
    }).then(
        (res) => callback(res.data),
        (error) => {
            console.warn('[updatePass]', error);
            callback(null);
        }
    );
};

export const verifyChangePass = (token: string, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/users/password/verify`,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        data: JSON.stringify({ token }),
    }).then(
        (res) => callback(res.data),
        (error) => {
            console.warn('[verifyChangePass]', error);
            callback(null);
        }
    );
};

export const changForgetPass = (pass: string, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/users/password/reset`,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        data: JSON.stringify({ pass }),
    }).then(
        (res) => callback(res.data),
        (error) => {
            console.warn('[changForgetPass]', error);
            callback(null);
        }
    );
};

// ============================================================
// CUSTOMER (guest)
// ============================================================

export const setUniqueCustomer = (callback: (val: any) => void) => {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/customers/unique`,
    }).then(
        (res) => callback(res.data),
        (error) => console.warn('[setUniqueCustomer]', error)
    );
};

export const checkCustomerData = (callback: (val: any) => void) => {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/customers/check`,
    }).then(
        (res) => callback(res.data),
        (error) => console.warn('[checkCustomerData]', error)
    );
};

// ============================================================
// NEWSLETTER
// ============================================================

type SubscribeNewsletterData = {
    email: string;
    username?: string;
};

type BroadcastData = {
    subject: string;
    content: string;
};

type NewsletterStats = {
    verified_count: number;
    pending_count: number;
    unsubscribed_count: number;
    total_count: number;
};

export const subscribeToNewsletter = (data: SubscribeNewsletterData, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/newsletter/subscribe`,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        data,
    }).then(
        (res) => callback(res.data),
        (error) => callback(error.response?.data ?? { error: 'Network error' })
    );
};

export const verifyNewsletterSubscription = (token: string, callback: (val: any) => void) => {
    axios({
        method: 'get',
        url: `${API_URL}/newsletter/verify/${token}`,
        withCredentials: true,
    }).then(
        (res) => callback(res.data),
        (error) => callback(error.response?.data ?? { error: 'Network error' })
    );
};

export const unsubscribeFromNewsletter = (email: string, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/newsletter/unsubscribe`,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        data: { email },
    }).then(
        (res) => callback(res.data),
        (error) => callback(error.response?.data ?? { error: 'Network error' })
    );
};

export const getNewsletterStats = (callback: (val: NewsletterStats | any) => void) => {
    axios({
        method: 'get',
        url: `${API_URL}/newsletter/stats`,
        withCredentials: true,
    }).then(
        (res) => callback(res.data),
        (error) => callback(error.response?.data ?? { error: 'Network error' })
    );
};
export type PromoCode = {
    id: number;
    code: string;
    name: string | null;
    description: string | null;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    applies_to: 'global' | 'collection';
    collection_id: number | null;
    collection_slug: string | null;
    collection_name: string | null;
    min_order: number | null;
    max_order: number | null;
    max_discount: number | null;
    starts_at: string;
    ends_at: string | null;
    usage_limit: number | null;
    per_user_limit: number | null;
    is_active: boolean;
    issued_to_customer_id: number;
    used_by_me: number;
};


export const getMyPromoCodes = async (): Promise<PromoCode[]> => {
    try {
        const res = await axios({
            method: 'get',
            url: `${API_URL}/my-promo-codes`,
            withCredentials: true,
        });
        return res.data ?? [];
    } catch (err: any) {
        if (err?.response?.status === 401) return [];
        console.warn('[getMyPromoCodes]', err);
        return [];
    }
};
export const sendNewsletterBroadcast = (data: BroadcastData, callback: (val: any) => void) => {
    axios({
        method: 'post',
        url: `${API_URL}/newsletter/broadcast`,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        data,
    }).then(
        (res) => callback(res.data),
        (error) => callback(error.response?.data ?? { error: 'Network error' })
    );
};
export type AddressInput = Omit<Address, 'id'>;