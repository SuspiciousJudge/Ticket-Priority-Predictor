import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PageTransition({ children }) {
    const location = useLocation();

    return (
        <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
}
