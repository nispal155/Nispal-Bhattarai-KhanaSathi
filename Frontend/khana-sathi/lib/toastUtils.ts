import toast from 'react-hot-toast';

/**
 * Toast Utility Functions with optimized durations
 * - Success: 3 seconds (quick feedback)
 * - Error: 5 seconds (needs time to read)
 * - Info: 4 seconds (default)
 * - Loading: 30 seconds (stays until promise resolves)
 */

export const showToast = {
  /**
   * Show a success message (3 seconds)
   * @param message - The success message to display
   * @example showToast.success('Order placed successfully!')
   */
  success: (message: string) => {
    return toast.success(message, {
      duration: 3000,
      icon: '✓',
    });
  },

  /**
   * Show an error message (5 seconds)
   * @param message - The error message to display
   * @example showToast.error('Failed to place order')
   */
  error: (message: string) => {
    return toast.error(message, {
      duration: 5000,
      icon: '✕',
    });
  },

  /**
   * Show an info/loading message (4 seconds)
   * @param message - The info message to display
   * @example showToast.info('Loading your orders...')
   */
  info: (message: string) => {
    return toast(message, {
      duration: 4000,
      icon: 'ℹ️',
    });
  },

  /**
   * Show a loading message (stays until promise resolves or 30 seconds)
   * @param promise - Promise to wait for
   * @param messages - Object with loading, success, and error messages
   * @example
   * showToast.promise(
   *   fetchData(),
   *   {
   *     loading: 'Loading...',
   *     success: 'Data loaded!',
   *     error: 'Failed to load data'
   *   }
   * )
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      success: {
        duration: 3000,
      },
      error: {
        duration: 5000,
      },
    });
  },

  /**
   * Show a warning message (4.5 seconds)
   * @param message - The warning message to display
   * @example showToast.warning('This action cannot be undone')
   */
  warning: (message: string) => {
    return toast(message, {
      duration: 4500,
      icon: '⚠️',
    });
  },

  /**
   * Dismiss a specific toast
   * @param toastId - The toast ID to dismiss
   * @example showToast.dismiss(toastId)
   */
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    }
  },

  /**
   * Dismiss all toasts
   * @example showToast.dismissAll()
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

export default showToast;
