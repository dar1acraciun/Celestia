import logo from '../assets/fullLogo.png'

function Footer(){
    return (
        <footer 
           className="flex flex-col items-center justify-center py-10 gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >   
        <img src={logo} alt="Celestia" style={{ height: '70px', width: '70px', objectFit: 'contain' }} />
        <p style={{ color: '#9999b3', fontSize: '0.875rem' }}>
        © 2025 Celestia. All rights reserved.
        </p>
        </footer>
    )
}
export default Footer
