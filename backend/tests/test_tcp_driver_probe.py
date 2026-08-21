import unittest
import sys
import os
from unittest.mock import patch, MagicMock
import socket

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.drivers.base_driver import BasePrinterDriver
from app.drivers.tcp_driver import TCPPrinterDriver
from app.drivers.spp_driver import SPPPrinterDriver, MockPrinterDriver


class TestTCPDriverProbe(unittest.TestCase):

    def test_tcp_driver_probe_success(self):
        driver = TCPPrinterDriver(host="10.0.0.205", port=9100)
        with patch("socket.socket") as mock_socket_cls:
            mock_sock = MagicMock()
            mock_sock.connect_ex.return_value = 0
            mock_socket_cls.return_value = mock_sock

            res = driver.probe_connection()

            mock_socket_cls.assert_called_once_with(socket.AF_INET, socket.SOCK_STREAM)
            mock_sock.settimeout.assert_called_once_with(2.0)
            mock_sock.connect_ex.assert_called_once_with(("10.0.0.205", 9100))
            mock_sock.close.assert_called_once()

            self.assertTrue(res.get("bridge_reachable"))
            self.assertEqual(res.get("host"), "10.0.0.205")
            self.assertEqual(res.get("port"), 9100)
            self.assertEqual(res.get("status"), "Bridge online and reachable")

    def test_tcp_driver_probe_connection_refused(self):
        driver = TCPPrinterDriver(host="10.0.0.205", port=9100)
        with patch("socket.socket") as mock_socket_cls:
            mock_sock = MagicMock()
            mock_sock.connect_ex.return_value = 111  # ECONNREFUSED
            mock_socket_cls.return_value = mock_sock

            res = driver.probe_connection()

            mock_sock.connect_ex.assert_called_once_with(("10.0.0.205", 9100))
            mock_sock.close.assert_called_once()

            self.assertFalse(res.get("bridge_reachable"))
            self.assertEqual(res.get("host"), "10.0.0.205")
            self.assertEqual(res.get("port"), 9100)
            self.assertIn("Bridge unreachable (code 111)", res.get("error", ""))

    def test_tcp_driver_probe_exception(self):
        driver = TCPPrinterDriver(host="invalid.host.domain", port=9100)
        with patch("socket.socket") as mock_socket_cls:
            mock_socket_cls.side_effect = socket.gaierror("Name or service not known")

            res = driver.probe_connection()

            self.assertFalse(res.get("bridge_reachable"))
            self.assertEqual(res.get("host"), "invalid.host.domain")
            self.assertEqual(res.get("port"), 9100)
            self.assertIn("Name or service not known", res.get("error", ""))

    def test_mock_driver_probe(self):
        driver = MockPrinterDriver()
        res = driver.probe_connection()
        self.assertTrue(res.get("bridge_reachable"))
        self.assertEqual(res.get("status"), "Mock printer driver active")

    def test_spp_driver_probe(self):
        driver = SPPPrinterDriver(mac_address="00:11:22:33:44:55")
        res = driver.probe_connection()
        self.assertFalse(res.get("bridge_reachable"))
        self.assertEqual(res.get("status"), "SPP direct Bluetooth bridge probing not supported over TCP")


if __name__ == "__main__":
    unittest.main()
