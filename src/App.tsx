import { HashRouter, Route, Routes } from 'react-router'
import { Debug } from './screens/Debug'
import { Detail } from './screens/Detail'
import { Home } from './screens/Home'
import { MyListings } from './screens/MyListings'
import { Publish } from './screens/Publish'
import { NotFound } from './screens/NotFound'
import { FiltersProvider } from './store/FiltersProvider'
import { StoreProvider } from './store/store'

// HashRouter: works on any static hosting without configuring rewrites (including /#/debug).
export default function App() {
  return (
    <StoreProvider>
      <FiltersProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/p/:id" element={<Detail />} />
            <Route path="/publicar" element={<Publish />} />
            <Route path="/mis-propiedades" element={<MyListings />} />
            <Route path="/debug" element={<Debug />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </FiltersProvider>
    </StoreProvider>
  )
}
